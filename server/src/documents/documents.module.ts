import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity, DocumentShare } from './document.entity';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { ImportService } from './import.service';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentEntity, DocumentShare])],
  controllers: [DocumentsController],
  providers: [DocumentsService, ImportService],
})
export class DocumentsModule {}
