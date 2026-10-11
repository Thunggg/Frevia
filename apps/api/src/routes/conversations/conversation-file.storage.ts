import { BadRequestException } from '@nestjs/common';
import { ManageConversationMessage } from '@shared/types';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { memoryStorage } from 'multer';
import { join } from 'path';
import { envConfig } from '../../shared/config/validate-env';

// Thư mục file upload cũ trên đĩa (giữ để phục vụ file đã upload trước đó)
export const UPLOADS_ROOT = join(process.cwd(), 'uploads');

// Giới hạn dung lượng file (25MB)
export const MAX_CONVERSATION_FILE_SIZE = 25 * 1024 * 1024;

cloudinary.config({
  cloud_name: envConfig.CLOUDINARY_CLOUD_NAME,
  api_key: envConfig.CLOUDINARY_API_KEY,
  api_secret: envConfig.CLOUDINARY_API_SECRET,
});

// Lưu file vào bộ nhớ, sau đó upload lên Cloudinary (không ghi đĩa)
export const conversationFileStorage = memoryStorage();

// Allow-list MIME type. Chỉ cho phép các loại file an toàn
// (tránh phục vụ html/svg/executable... gây XSS khi xem trực tiếp).
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/x-icon': 'ico',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'pptx',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/csv': 'csv',
  'text/javascript': 'js',
  'application/json': 'json',
  'application/xml': 'xml',
  'text/xml': 'xml',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'application/gzip': 'gz',
  'application/x-7z-compressed': '7z',
  'application/x-rar-compressed': 'rar',
  'application/x-tar': 'tar',
};

export const isAllowedFileType = (mimetype: string): boolean =>
  mimetype in MIME_TO_EXTENSION;

export const conversationFileFilter = (
  _req: unknown,
  file: { mimetype: string },
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!isAllowedFileType(file.mimetype)) {
    callback(
      new BadRequestException([
        {
          message: ManageConversationMessage.FILE_TYPE_NOT_ALLOWED,
          path: 'file',
        },
      ]),
      false,
    );
    return;
  }
  callback(null, true);
};

// Upload buffer file lên Cloudinary, trả về URL an toàn + dung lượng thực tế
export const uploadConversationFile = async (
  file: Express.Multer.File,
): Promise<{ secureUrl: string; bytes: number }> => {
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'conversations', resource_type: 'auto' },
      (error, callResult) => {
        if (error) {
          reject(new Error(error.message ?? 'Cloudinary upload failed'));
        } else {
          resolve(callResult as UploadApiResponse);
        }
      },
    );
    stream.end(file.buffer);
  });

  return { secureUrl: result.secure_url, bytes: result.bytes };
};
