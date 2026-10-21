import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ProfileRevisionType } from '@prisma/client';
import {
  ApproveProfileRevisionType,
  ProfileRevisionAdminFilterType,
  RejectProfileRevisionType,
} from '@shared/types';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  ApproveProfileRevisionDto,
  MyProfileRevisionDto,
  ProfileRevisionAdminFilterDto,
  ProfileRevisionAdminListDto,
  ProfileRevisionDetailDto,
  RejectProfileRevisionDto,
} from './profile-revision.dto';
import { ProfileRevisionService } from './profile-revision.service';

@Controller('profile-revisions')
export class ProfileRevisionController {
  constructor(private readonly service: ProfileRevisionService) {}

  @Get('me')
  @ZodSerializerDto(MyProfileRevisionDto)
  latest(
    @UserActive('userId') userId: number,
    @Query('type', new ParseEnumPipe(ProfileRevisionType))
    profileType: ProfileRevisionType,
  ) {
    return this.service.latestForUser(userId, profileType);
  }
}

@Controller('admin/profile-revisions')
export class ProfileRevisionAdminController {
  constructor(private readonly service: ProfileRevisionService) {}

  @Get()
  @ZodSerializerDto(ProfileRevisionAdminListDto)
  list(@Query() query: ProfileRevisionAdminFilterDto) {
    return this.service.list(query as ProfileRevisionAdminFilterType);
  }

  @Get(':id')
  @ZodSerializerDto(ProfileRevisionDetailDto)
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.detail(id);
  }

  @Patch(':id/approve')
  @ZodSerializerDto(ProfileRevisionDetailDto)
  approve(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') adminId: number,
    @Body() body: ApproveProfileRevisionDto,
  ) {
    return this.service.approve(
      id,
      adminId,
      (body as ApproveProfileRevisionType).reviewNotes,
    );
  }

  @Patch(':id/reject')
  @ZodSerializerDto(ProfileRevisionDetailDto)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') adminId: number,
    @Body() body: RejectProfileRevisionDto,
  ) {
    return this.service.reject(
      id,
      adminId,
      (body as RejectProfileRevisionType).reviewNotes,
    );
  }
}
