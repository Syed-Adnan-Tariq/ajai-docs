import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Title cannot be empty' })
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1_000_000, { message: 'Document is too large' })
  content?: string;
}

export class ShareDocumentDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @IsIn(['editor', 'viewer'])
  role: 'editor' | 'viewer';
}
