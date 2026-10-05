import 'reflect-metadata';
import { createApp } from './app.factory';

async function bootstrap() {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is not set; using an insecure default. Set it in production.');
  }
  const app = await createApp();
  if (process.env.NODE_ENV !== 'production') app.enableCors({ origin: true });
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on :${port}`);
}
bootstrap();
