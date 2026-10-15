import { HttpException, Injectable } from '@nestjs/common';
import { dirname, join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import {
  BannerAdminDeleteResponseType,
  BannerAdminDetailResponseType,
  BannerAdminListResponseType,
  BannerAdminQueryType,
  BannerCreateBodyType,
  BannerUpdateBodyType,
} from '@shared/types';
import { CloudinaryService } from '../../shared/services/cloudinary.service';
import {
  BannerAdminNotFoundException,
  BannerImageInvalidTypeException,
  BannerImageRequiredException,
  BannerImageTooLargeException,
  FailedToCreateBannerException,
  FailedToDeleteBannerException,
  FailedToLoadBannerDetailException,
  FailedToLoadBannerListException,
  FailedToRestoreBannerException,
  FailedToUpdateBannerException,
  FailedToUploadBannerImageException,
} from './banners-admin.error';
import { BannersAdminRepository } from './banners-admin.repo';

export const MAX_BANNER_IMAGE_SIZE = 10 * 1024 * 1024;

const BANNER_MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
};

@Injectable()
export class BannersAdminService {
  constructor(
    private readonly repository: BannersAdminRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Upload ảnh banner: lên Cloudinary nếu đã cấu hình, ngược lại lưu local
  // (dev). Trả về URL dùng được để lưu vào imageUrl.
  async uploadImage(
    file?: Express.Multer.File,
  ): Promise<{ imageUrl: string; publicId: string }> {
    try {
      if (!file) {
        throw BannerImageRequiredException();
      }
      const extension = BANNER_MIME_TO_EXTENSION[file.mimetype];
      if (!extension) {
        throw BannerImageInvalidTypeException();
      }
      if (file.size > MAX_BANNER_IMAGE_SIZE) {
        throw BannerImageTooLargeException();
      }

      if (this.cloudinaryService.isConfigured()) {
        const result = await this.cloudinaryService.uploadFile(
          file,
          'frevia/banners',
        );
        return {
          imageUrl: result.secure_url,
          publicId: result.public_id,
        };
      }

      const filename = `${randomUUID()}${extension}`;
      const relativePath = join('banners', filename);
      const absolutePath = join(process.cwd(), 'uploads', relativePath);
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, file.buffer);
      return {
        imageUrl: `/api/backend/api/banners/image/${filename}`,
        publicId: '',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToUploadBannerImageException();
    }
  }

  // Lấy danh sách banner (phân trang + tìm kiếm + lọc position/deleted)
  async listBanners(
    query: BannerAdminQueryType,
  ): Promise<BannerAdminListResponseType> {
    try {
      return await this.repository.listBanners(query);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToLoadBannerListException();
    }
  }

  // Xem chi tiết 1 banner
  async getBannerDetail(id: number): Promise<BannerAdminDetailResponseType> {
    try {
      const banner = await this.repository.getBannerDetail(id);
      if (!banner) {
        throw BannerAdminNotFoundException();
      }
      return banner;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToLoadBannerDetailException();
    }
  }

  // Tạo banner mới
  async createBanner(
    body: BannerCreateBodyType,
  ): Promise<BannerAdminDetailResponseType> {
    try {
      return await this.repository.createBanner(body);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToCreateBannerException();
    }
  }

  // Cập nhật banner
  async updateBanner(
    id: number,
    body: BannerUpdateBodyType,
  ): Promise<BannerAdminDetailResponseType> {
    try {
      return await this.repository.updateBanner(id, body);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToUpdateBannerException();
    }
  }

  // Xóa banner (soft delete)
  async deleteBanner(id: number): Promise<BannerAdminDeleteResponseType> {
    try {
      return await this.repository.deleteBanner(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToDeleteBannerException();
    }
  }

  // Khôi phục banner đã xóa
  async restoreBanner(id: number): Promise<BannerAdminDetailResponseType> {
    try {
      return await this.repository.restoreBanner(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToRestoreBannerException();
    }
  }
}
