import { BadRequestException, Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { marked } from 'marked';
import { extname } from 'path';
import { sanitizeContent } from './sanitize';

export const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.markdown', '.docx'];
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

@Injectable()
export class ImportService {
  /** Converts an uploaded file to sanitized editor HTML plus a title derived from the filename. */
  async toDocument(file: { originalname: string; buffer: Buffer }) {
    const ext = extname(file.originalname).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `Unsupported file type "${ext || 'unknown'}". Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`,
      );
    }
    if (!file.buffer?.length) throw new BadRequestException('The uploaded file is empty');

    let html: string;
    if (ext === '.txt') {
      html = this.textToHtml(file.buffer.toString('utf-8'));
    } else if (ext === '.docx') {
      // .docx is a zip container; reject anything that doesn't start with the zip signature.
      if (file.buffer.subarray(0, 2).toString('latin1') !== 'PK') {
        throw new BadRequestException('This file is not a valid .docx document');
      }
      try {
        html = (await mammoth.convertToHtml({ buffer: file.buffer })).value;
      } catch {
        throw new BadRequestException('Could not read this .docx file. It may be corrupted.');
      }
    } else {
      html = await marked.parse(file.buffer.toString('utf-8'));
    }

    const title = file.originalname.slice(0, file.originalname.length - ext.length).trim() || 'Imported document';
    return { title: title.slice(0, 200), content: sanitizeContent(html) };
  }

  private textToHtml(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .split(/\n{2,}/)
      .filter((block) => block.trim().length)
      .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
      .join('');
  }
}
