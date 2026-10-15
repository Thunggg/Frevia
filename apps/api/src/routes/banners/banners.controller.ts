import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { createReadStream } from 'fs';
import type { Response } from 'express';
import { IsPublic } from '../../shared/decorators/auth.decorator';
import {
  BannerPublicListResponseDto,
  BannerPublicQueryDto,
} from './banners.dto';
import { BannersService } from './banners.service';

@Controller('banners')
export class BannersController {
  constructor(private readonly service: BannersService) {}

  // Công khai: lấy banner active theo vị trí hiển thị (vd /api/banners?position=HOME_HERO)
  @Get()
  @IsPublic()
  @ZodSerializerDto(BannerPublicListResponseDto)
  getBannersByPosition(@Query() query: BannerPublicQueryDto) {
    return this.service.getBannersByPosition(query.position);
  }

  // Công khai: phục vụ ảnh banner lưu local trong dev (không cấu hình Cloudinary)
  @Get('image/:filename')
  @IsPublic()
  getImage(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = this.service.getLocalImage(filename);
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return new StreamableFile(createReadStream(file.absolutePath));
  }
}
