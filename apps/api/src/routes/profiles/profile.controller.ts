import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { IsPublic } from '../../../shared/decorators/auth.decorator';
import {
  FreelancerProfileDetailResponseDto,
  UpdateFreelancerProfileDto,
  UpdateFreelancerProfileResponseDto,
} from './profile.dto';
import { ProfileService } from './profile.service';
import type { UpdateFreelancerProfileType } from '@shared/types';
import { UserActive } from '../../../shared/decorators/user-active.decorators';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':id')
  @IsPublic()
  @ZodSerializerDto(FreelancerProfileDetailResponseDto)
  async getFreelancerProfile(@Param('id', ParseIntPipe) id: number) {
    return this.profileService.getFreelancerProfile(id);
  }

  @Put(':id')
  @ZodSerializerDto(UpdateFreelancerProfileResponseDto)
  async updateFreelancerProfile(
    @UserActive('userId') currentUserId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateFreelancerProfileDto))
    body: UpdateFreelancerProfileType,
  ) {
    return this.profileService.updateFreelancerProfile(id, currentUserId, body);
  }
}
