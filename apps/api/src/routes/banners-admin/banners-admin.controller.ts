import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZodSerializerDto } from 'nestjs-zod';
import type {
  BannerAdminQueryType,
  BannerCreateBodyType,
  BannerUpdateBodyType,
} from '@shared/types';
import {
  BannerAdminDeleteResponseDto,
  BannerAdminDetailResponseDto,
  BannerAdminListResponseDto,
  BannerAdminQueryDto,
  CreateBannerBodyDto,
  UpdateBannerBodyDto,
} from './banners-admin.dto';
import { BannersAdminService } from './banners-admin.service';

// Trang Admin quản lý banner quảng cáo (AdvertisementBanner): danh sách + chi tiết + tạo mới
// Bảo mật: PermissionGuard tự chặn theo method+path; mặc định chỉ Admin có quyền.
@Controller('admin/banners')
export class BannersAdminController {
  constructor(private readonly service: BannersAdminService) {}

  @Get()
  @ZodSerializerDto(BannerAdminListResponseDto)
  listBanners(@Query() query: BannerAdminQueryDto) {
    return this.service.listBanners(query as BannerAdminQueryType);
  }

  @Post()
  @ZodSerializerDto(BannerAdminDetailResponseDto)
  createBanner(@Body() body: CreateBannerBodyDto) {
    return this.service.createBanner(body as BannerCreateBodyType);
  }

  @Patch(':id')
  @ZodSerializerDto(BannerAdminDetailResponseDto)
  updateBanner(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateBannerBodyDto,
  ) {
    return this.service.updateBanner(id, body as BannerUpdateBodyType);
  }

  @Patch(':id/restore')
  @ZodSerializerDto(BannerAdminDetailResponseDto)
  restoreBanner(@Param('id', ParseIntPipe) id: number) {
    return this.service.restoreBanner(id);
  }

  @Delete(':id')
  @ZodSerializerDto(BannerAdminDeleteResponseDto)
  deleteBanner(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteBanner(id);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  uploadImage(@UploadedFile() file?: Express.Multer.File) {
    return this.service.uploadImage(file);
  }

  @Get(':id')
  @ZodSerializerDto(BannerAdminDetailResponseDto)
  getBannerDetail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getBannerDetail(id);
  }
}
