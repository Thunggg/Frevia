import { HttpException, Injectable } from '@nestjs/common';
import { BannerPosition } from '@prisma/client';
import { BannerPublicListResponseType } from '@shared/types';
import { isAbsolute, relative, resolve, extname } from 'path';
import {
  BannerImageNotFoundException,
  FailedToLoadBannerListException,
} from '../banners-admin/banners-admin.error';
import { BannersRepository } from './banners.repo';

const BANNER_EXTENSION_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
};

@Injectable()
export class BannersService {
  constructor(private readonly repository: BannersRepository) {}

  // Lấy banner hiển thị theo vị trí (public, không cần đăng nhập)
  async getBannersByPosition(
    position: BannerPosition,
  ): Promise<BannerPublicListResponseType> {
    try {
      const banners = await this.repository.findActiveByPosition(position);
      return { banners };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToLoadBannerListException();
    }
  }

  // Phục vụ ảnh banner lưu local. Chỉ cho phép truy cập trong thư mục uploads/banners.
  getLocalImage(filename: string): {
    absolutePath: string;
    mimeType: string;
  } {
    const uploadsRoot = resolve(process.cwd(), 'uploads');
    const bannersRoot = resolve(uploadsRoot, 'banners');
    const absolutePath = resolve(bannersRoot, filename);
    const pathFromBannersRoot = relative(bannersRoot, absolutePath);
    if (
      pathFromBannersRoot.startsWith('..') ||
      isAbsolute(pathFromBannersRoot)
    ) {
      throw BannerImageNotFoundException();
    }
    const mimeType = BANNER_EXTENSION_TO_MIME[extname(filename).toLowerCase()];
    if (!mimeType) {
      throw BannerImageNotFoundException();
    }
    return { absolutePath, mimeType };
  }
}
