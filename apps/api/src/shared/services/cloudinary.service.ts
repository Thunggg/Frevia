import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { envConfig } from '../config/validate-env';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    cloudinary.config({
      cloud_name:
        envConfig.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
      api_key: envConfig.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
      api_secret:
        envConfig.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET,
    });
  }

  isConfigured() {
    const credentials = [
      envConfig.CLOUDINARY_CLOUD_NAME,
      envConfig.CLOUDINARY_API_KEY,
      envConfig.CLOUDINARY_API_SECRET,
    ];
    return credentials.every((credential) => {
      const normalized = credential.trim().toLowerCase();
      return (
        normalized.length > 0 &&
        !normalized.startsWith('dummy') &&
        !normalized.includes('placeholder') &&
        !normalized.includes('change_me')
      );
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'frevia/shared-files',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          filename_override: file.originalname,
          use_filename: true,
        },
        (error, result) => {
          if (error) {
            this.logger.error(
              `Cloudinary upload error: ${error.message}`,
              error.stack,
            );
            return reject(new Error(error.message, { cause: error }));
          }
          if (!result) {
            return reject(new Error('Cloudinary upload returned empty result'));
          }
          resolve(result);
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteFile(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
      });

      if (result.result === 'not_found') {
        return await cloudinary.uploader.destroy(publicId, {
          resource_type: 'raw',
          invalidate: true,
        });
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Cloudinary delete error for publicId ${publicId}:`,
        error,
      );
      throw error;
    }
  }
}
