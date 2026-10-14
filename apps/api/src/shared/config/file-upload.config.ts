import {
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseFilePipe,
} from '@nestjs/common';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const ALLOWED_FILE_MIME_TYPES =
  /^(image\/(jpeg|png|gif|webp|bmp|tiff)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation|zip|x-zip-compressed|x-7z-compressed|x-rar-compressed|octet-stream)|text\/(plain|csv)|video\/(mp4|quicktime|x-msvideo)|audio\/(mpeg|wav|ogg))$/;

export const buildUploadFilePipe = (fileIsRequired = true) =>
  new ParseFilePipe({
    fileIsRequired,
    validators: [
      new MaxFileSizeValidator({
        maxSize: MAX_FILE_SIZE_BYTES,
        message: `File size must not exceed ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`,
      }),
      new FileTypeValidator({
        fileType: ALLOWED_FILE_MIME_TYPES,
      }),
    ],
  });
