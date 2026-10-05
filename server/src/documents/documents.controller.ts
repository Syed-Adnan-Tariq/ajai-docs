import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDocumentDto, ShareDocumentDto, UpdateDocumentDto } from './dto';
import { DocumentsService } from './documents.service';
import { ImportService, MAX_UPLOAD_BYTES } from './import.service';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly docs: DocumentsService, private readonly importer: ImportService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.docs.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDocumentDto) {
    return this.docs.create(user.id, { title: dto.title });
  }

  /** Upload a .txt / .md / .docx file and turn it into a new editable document. */
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async import(@CurrentUser() user: AuthUser, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Attach a file in the "file" field (max 2 MB)');
    const { title, content } = await this.importer.toDocument(file);
    return this.docs.create(user.id, { title, content });
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.docs.get(id, user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.docs.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.docs.remove(id, user.id);
  }

  @Get(':id/shares')
  listShares(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.docs.listShares(id, user.id);
  }

  @Post(':id/shares')
  share(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ShareDocumentDto,
  ) {
    return this.docs.share(id, user.id, dto.email, dto.role);
  }

  @Delete(':id/shares/:userId')
  @HttpCode(204)
  async unshare(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
  ) {
    await this.docs.unshare(id, user.id, targetUserId);
  }
}
