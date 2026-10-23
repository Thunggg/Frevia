import {
  BadRequestException,
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import { ManageSharedFileMessage } from '@shared/types';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const ALLOWED_FILE_MIME_TYPES =
  /^(image\/(jpeg|png|gif|webp|bmp|tiff)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation|zip|x-zip-compressed|x-7z-compressed|x-rar-compressed|octet-stream)|text\/(plain|csv)|video\/(mp4|quicktime|x-msvideo)|audio\/(mpeg|wav|ogg))$/;

const MAX_FILE_SIZE_MB = MAX_FILE_SIZE_BYTES / 1024 / 1024;

export const buildUploadFilePipe = (fileIsRequired = true) =>
  new ParseFilePipe({
    fileIsRequired,
    validators: [
      new MaxFileSizeValidator({
        maxSize: MAX_FILE_SIZE_BYTES,
        message: ManageSharedFileMessage.FILE_SIZE_EXCEEDED,
      }),
      new FileTypeValidator({
        fileType: ALLOWED_FILE_MIME_TYPES,
      }),
    ],
    // Mặc định Nest trả `message` dạng chuỗi thô khiến frontend không dịch
    // được. Ép về dạng issue có `path` để giống các lỗi validation khác.
    exceptionFactory: (error) =>
      new BadRequestException([
        { message: error, path: 'file', size: MAX_FILE_SIZE_MB },
      ]),
  });
