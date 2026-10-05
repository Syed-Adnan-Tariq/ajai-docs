import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { AuthModule } from './auth/auth.module';
import { DocumentEntity, DocumentShare } from './documents/document.entity';
import { DocumentsModule } from './documents/documents.module';
import { User } from './users/user.entity';

const dbPath = process.env.DB_PATH || join(process.cwd(), 'data', 'app.db');
if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });

// In production the built React app is served by the API so one service = one deploy.
const clientDist = process.env.CLIENT_DIST || join(__dirname, '..', '..', 'client', 'dist');
const staticImports = existsSync(clientDist)
  ? [ServeStaticModule.forRoot({ rootPath: clientDist, exclude: ['/api/(.*)'] })]
  : [];

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: dbPath,
      entities: [User, DocumentEntity, DocumentShare],
      // synchronize keeps setup zero-config for a take-home; use migrations for production.
      synchronize: true,
    }),
    AuthModule,
    DocumentsModule,
    ...staticImports,
  ],
})
export class AppModule {}
