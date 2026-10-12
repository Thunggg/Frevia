import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { VerificationStatus } from '@prisma/client';
import { ZodSerializerDto } from 'nestjs-zod';
import { createReadStream } from 'fs';
import type { Response } from 'express';
import {
  ApproveIdentityVerificationBodyType,
  IdentityVerificationAdminFilterType,
  RejectIdentityVerificationBodyType,
} from '@shared/types';
import { UserActive } from '../../../shared/decorators/user-active.decorators';
import {
  ApproveIdentityVerificationBodyDto,
  IdentityVerificationAdminActionResponseDto,
  IdentityVerificationAdminDetailResponseDto,
  IdentityVerificationAdminFilterDto,
  IdentityVerificationAdminListResponseDto,
  RejectIdentityVerificationBodyDto,
} from './identity-verifications-admin.dto';
import { IdentityVerificationsAdminService } from './identity-verifications-admin.service';

@Controller('admin/identity-verifications')
export class IdentityVerificationsAdminController {
  constructor(private readonly service: IdentityVerificationsAdminService) {}

  @Get()
  @ZodSerializerDto(IdentityVerificationAdminListResponseDto)
  list(@Query() query: IdentityVerificationAdminFilterDto) {
    return this.service.list(query as IdentityVerificationAdminFilterType);
  }

  @Get(':id')
  @ZodSerializerDto(IdentityVerificationAdminDetailResponseDto)
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.detail(id);
  }

  @Get(':id/file')
  async file(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.service.getLocalFile(id);
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${file.fileName.replace(/"/g, '')}"`,
    );
    response.setHeader('Content-Type', 'application/octet-stream');
    return new StreamableFile(createReadStream(file.absolutePath));
  }

  @Patch(':id/approve')
  @ZodSerializerDto(IdentityVerificationAdminActionResponseDto)
  approve(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') adminId: number,
    @Body() body: ApproveIdentityVerificationBodyDto,
  ) {
    return this.service.review(
      id,
      adminId,
      VerificationStatus.APPROVED,
      (body as ApproveIdentityVerificationBodyType).reviewNotes || null,
    );
  }

  @Patch(':id/reject')
  @ZodSerializerDto(IdentityVerificationAdminActionResponseDto)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') adminId: number,
    @Body() body: RejectIdentityVerificationBodyDto,
  ) {
    return this.service.review(
      id,
      adminId,
      VerificationStatus.REJECTED,
      (body as RejectIdentityVerificationBodyType).reviewNotes || null,
    );
  }
}
