import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { BannerMessage } from '@shared/types';

// ====== Exception cho trang Admin quản lý banner quảng cáo (AdvertisementBanner) ======

export const BannerAdminNotFoundException = () =>
  new NotFoundException([
    {
      message: BannerMessage.BANNER_NOT_FOUND,
      path: 'bannerId',
    },
  ]);

// Vị trí (position) đã được dùng bởi banner active khác → mỗi position chỉ có 1 banner active
export const BannerPositionTakenException = () =>
  new ConflictException([
    {
      message: BannerMessage.BANNER_POSITION_TAKEN,
      path: 'position',
    },
  ]);

export const FailedToLoadBannerListException = () =>
  new InternalServerErrorException([
    {
      message: BannerMessage.FAILED_TO_LOAD_BANNERS,
      path: 'banners',
    },
  ]);

export const FailedToLoadBannerDetailException = () =>
  new InternalServerErrorException([
    {
      message: BannerMessage.FAILED_TO_LOAD_BANNER_DETAIL,
      path: 'bannerId',
    },
  ]);

export const FailedToCreateBannerException = () =>
  new InternalServerErrorException([
    {
      message: BannerMessage.FAILED_TO_CREATE_BANNER,
      path: 'banner',
    },
  ]);

export const FailedToUpdateBannerException = () =>
  new InternalServerErrorException([
    {
      message: BannerMessage.FAILED_TO_UPDATE_BANNER,
      path: 'banner',
    },
  ]);

export const FailedToDeleteBannerException = () =>
  new InternalServerErrorException([
    {
      message: BannerMessage.FAILED_TO_DELETE_BANNER,
      path: 'bannerId',
    },
  ]);

export const FailedToRestoreBannerException = () =>
  new InternalServerErrorException([
    {
      message: BannerMessage.FAILED_TO_RESTORE_BANNER,
      path: 'bannerId',
    },
  ]);

// ====== Upload ảnh banner ======

// Không có file đính kèm
export const BannerImageRequiredException = () =>
  new BadRequestException([
    {
      message: BannerMessage.BANNER_IMAGE_REQUIRED,
      path: 'file',
    },
  ]);

// File không phải ảnh (chỉ chấp nhận image/*)
export const BannerImageInvalidTypeException = () =>
  new BadRequestException([
    {
      message: BannerMessage.BANNER_IMAGE_INVALID_TYPE,
      path: 'file',
    },
  ]);

// File vượt giới hạn 10MB
export const BannerImageTooLargeException = () =>
  new BadRequestException([
    {
      message: BannerMessage.BANNER_IMAGE_TOO_LARGE,
      path: 'file',
    },
  ]);

export const FailedToUploadBannerImageException = () =>
  new InternalServerErrorException([
    {
      message: BannerMessage.FAILED_TO_UPLOAD_BANNER_IMAGE,
      path: 'file',
    },
  ]);

// Ảnh local không tìm thấy hoặc path không hợp lệ
export const BannerImageNotFoundException = () =>
  new NotFoundException([
    {
      message: BannerMessage.BANNER_IMAGE_NOT_FOUND,
      path: 'filename',
    },
  ]);
