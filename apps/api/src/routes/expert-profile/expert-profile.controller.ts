import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Put,
} from '@nestjs/common';
import type {
  AdminUpdateExpertProfileType,
  UpdateExpertProfileType,
} from '@shared/types';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import { MessageResDTO } from '../../shared/dtos/response.dto';
import {
  ExpertProfileDto,
  ExpertProfileUpdateResponseDto,
  AdminUpdateExpertProfileDto,
  UpdateExpertProfileDto,
} from './expert-profile.dto';
import { ExpertProfileService } from './expert-profile.service';

@Controller('expert-profile')
export class ExpertProfileController {
  constructor(private readonly service: ExpertProfileService) {}

  @Get('me')
  @ZodSerializerDto(ExpertProfileDto)
  getMine(@UserActive('userId') userId: number) {
    return this.service.getMine(userId);
  }

  @Put('me')
  @ZodSerializerDto(ExpertProfileUpdateResponseDto)
  updateMine(
    @UserActive('userId') userId: number,
    @Body() body: UpdateExpertProfileDto,
  ) {
    return this.service.submitUpdate(userId, body as UpdateExpertProfileType);
  }
}

@Controller('users')
export class AdminExpertProfileController {
  constructor(private readonly service: ExpertProfileService) {}

  @Patch(':id/expert-profile')
  @ZodSerializerDto(MessageResDTO)
  update(
    @Param('id', ParseIntPipe) userId: number,
    @UserActive('userId') adminId: number,
    @Body() body: AdminUpdateExpertProfileDto,
  ) {
    return this.service.updateByAdmin(
      userId,
      adminId,
      body as AdminUpdateExpertProfileType,
    );
  }
}
