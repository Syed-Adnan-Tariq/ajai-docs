import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret';

describe('Documents API (access control, sanitisation, import)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  const login = async (email: string) => {
    const res = await http.post('/api/auth/login').send({ email, password: 'password123' }).expect(200);
    return `Bearer ${res.body.token}`;
  };

  beforeAll(async () => {
    const { AppModule } = await import('../src/app.module');
    const { configureApp } = await import('../src/app.factory');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = await configureApp(moduleRef.createNestApplication());
    await app.init();
    http = request(app.getHttpServer());
  });

  afterAll(async () => app.close());

  it('rejects unauthenticated requests and bad credentials', async () => {
    await http.get('/api/documents').expect(401);
    await http.post('/api/auth/login').send({ email: 'alice@example.com', password: 'nope' }).expect(401);
  });

  it('enforces owner / editor / viewer permissions end to end', async () => {
    const alice = await login('alice@example.com');
    const bob = await login('bob@example.com');
    const carol = await login('carol@example.com');

    // Alice creates and edits a document; content is persisted.
    const { body: created } = await http.post('/api/documents').set('Authorization', alice).send({ title: 'Plan' }).expect(201);
    const id = created.id;
    await http.patch(`/api/documents/${id}`).set('Authorization', alice).send({ content: '<h1>Hi</h1><p><strong>bold</strong></p>' }).expect(200);
    const fetched = await http.get(`/api/documents/${id}`).set('Authorization', alice).expect(200);
    expect(fetched.body).toMatchObject({ title: 'Plan', role: 'owner', content: '<h1>Hi</h1><p><strong>bold</strong></p>' });

    // Bob has no access: 404, not 403, and it is absent from his lists.
    await http.get(`/api/documents/${id}`).set('Authorization', bob).expect(404);
    expect((await http.get('/api/documents').set('Authorization', bob)).body).toEqual({ owned: [], shared: [] });

    // Viewer share: can read, cannot write.
    await http.post(`/api/documents/${id}/shares`).set('Authorization', alice).send({ email: 'bob@example.com', role: 'viewer' }).expect(201);
    const bobList = (await http.get('/api/documents').set('Authorization', bob)).body;
    expect(bobList.owned).toHaveLength(0);
    expect(bobList.shared[0]).toMatchObject({ id, role: 'viewer', owner: { email: 'alice@example.com' } });
    await http.patch(`/api/documents/${id}`).set('Authorization', bob).send({ content: '<p>hacked</p>' }).expect(403);

    // Upgrade to editor: can edit content, still cannot rename, share, or delete.
    await http.post(`/api/documents/${id}/shares`).set('Authorization', alice).send({ email: 'bob@example.com', role: 'editor' }).expect(201);
    await http.patch(`/api/documents/${id}`).set('Authorization', bob).send({ content: '<p>edited by bob</p>' }).expect(200);
    await http.patch(`/api/documents/${id}`).set('Authorization', bob).send({ title: 'Mine now' }).expect(403);
    await http.post(`/api/documents/${id}/shares`).set('Authorization', bob).send({ email: 'carol@example.com', role: 'viewer' }).expect(403);
    await http.delete(`/api/documents/${id}`).set('Authorization', bob).expect(403);

    // Carol was never shared in.
    await http.get(`/api/documents/${id}`).set('Authorization', carol).expect(404);

    // Revoking access removes it immediately.
    await http.delete(`/api/documents/${id}/shares/${(await http.get(`/api/documents/${id}/shares`).set('Authorization', alice)).body[0].userId}`).set('Authorization', alice).expect(204);
    await http.get(`/api/documents/${id}`).set('Authorization', bob).expect(404);
  });

  it('validates share input', async () => {
    const alice = await login('alice@example.com');
    const { body } = await http.post('/api/documents').set('Authorization', alice).send({}).expect(201);
    await http.post(`/api/documents/${body.id}/shares`).set('Authorization', alice).send({ email: 'nobody@example.com', role: 'viewer' }).expect(404);
    await http.post(`/api/documents/${body.id}/shares`).set('Authorization', alice).send({ email: 'alice@example.com', role: 'viewer' }).expect(400);
    await http.post(`/api/documents/${body.id}/shares`).set('Authorization', alice).send({ email: 'not-an-email', role: 'viewer' }).expect(400);
    await http.patch(`/api/documents/${body.id}`).set('Authorization', alice).send({ title: '   ' }).expect(400);
  });

  it('strips scripts and event handlers from saved content', async () => {
    const alice = await login('alice@example.com');
    const { body } = await http.post('/api/documents').set('Authorization', alice).send({}).expect(201);
    await http.patch(`/api/documents/${body.id}`).set('Authorization', alice)
      .send({ content: '<p onclick="x()">ok</p><script>alert(1)</script><a href="javascript:alert(1)">l</a>' }).expect(200);
    const { body: doc } = await http.get(`/api/documents/${body.id}`).set('Authorization', alice);
    expect(doc.content).not.toMatch(/script|onclick|javascript:/i);
    expect(doc.content).toContain('ok');
  });

  it('imports .md and .txt into editable documents and rejects bad files', async () => {
    const alice = await login('alice@example.com');

    const md = await http.post('/api/documents/import').set('Authorization', alice)
      .attach('file', Buffer.from('# Title\n\n- one\n- two\n\n**bold**'), 'notes.md').expect(201);
    const mdDoc = (await http.get(`/api/documents/${md.body.id}`).set('Authorization', alice)).body;
    expect(mdDoc.title).toBe('notes');
    expect(mdDoc.content).toContain('<h1');
    expect(mdDoc.content).toContain('<li>one</li>');

    const txt = await http.post('/api/documents/import').set('Authorization', alice)
      .attach('file', Buffer.from('line <b>1</b>\nline 2\n\nsecond para'), 'plain.txt').expect(201);
    const txtDoc = (await http.get(`/api/documents/${txt.body.id}`).set('Authorization', alice)).body;
    expect(txtDoc.content).toBe('<p>line &lt;b&gt;1&lt;/b&gt;<br />line 2</p><p>second para</p>');

    await http.post('/api/documents/import').set('Authorization', alice).attach('file', Buffer.from('x'), 'virus.exe').expect(400);
    await http.post('/api/documents/import').set('Authorization', alice).attach('file', Buffer.from('not a zip'), 'fake.docx').expect(400);
    await http.post('/api/documents/import').set('Authorization', alice).expect(400);
  });
});
