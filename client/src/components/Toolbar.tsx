import { Editor } from '@tiptap/react';

export default function Toolbar({ editor }: { editor: Editor }) {
  const heading = [1, 2, 3].find((l) => editor.isActive('heading', { level: l })) ?? 0;

  const setBlock = (value: string) => {
    const chain = editor.chain().focus();
    if (value === '0') chain.setParagraph().run();
    else chain.setHeading({ level: Number(value) as 1 | 2 | 3 }).run();
  };

  const Btn = (p: { label: string; title: string; active?: boolean; onClick: () => void; style?: React.CSSProperties }) => (
    <button type="button" title={p.title} aria-label={p.title} aria-pressed={p.active}
      className={p.active ? 'tb active' : 'tb'} style={p.style}
      onMouseDown={(e) => e.preventDefault()} onClick={p.onClick}>
      {p.label}
    </button>
  );

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      <select aria-label="Text style" value={heading} onChange={(e) => setBlock(e.target.value)}>
        <option value={0}>Normal text</option>
        <option value={1}>Heading 1</option>
        <option value={2}>Heading 2</option>
        <option value={3}>Heading 3</option>
      </select>
      <span className="sep" />
      <Btn label="B" title="Bold (Ctrl+B)" style={{ fontWeight: 700 }} active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
      <Btn label="I" title="Italic (Ctrl+I)" style={{ fontStyle: 'italic' }} active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <Btn label="U" title="Underline (Ctrl+U)" style={{ textDecoration: 'underline' }} active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
      <span className="sep" />
      <Btn label="• List" title="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <Btn label="1. List" title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <span className="sep" />
      <Btn label="Undo" title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} />
      <Btn label="Redo" title="Redo (Ctrl+Shift+Z)" onClick={() => editor.chain().focus().redo().run()} />
    </div>
  );
}
