import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { IsPublic } from '../../shared/decorators/auth.decorator';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import { ProfileService } from './profile.service';
import {
  UpdateFreelancerProfileDto,
  FreelancerProfileDetailDto,
  AddFreelancerSkillDto,
  AddFreelancerSkillResponseDto,
} from './profile.dto';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':id')
  @IsPublic()
  @ZodSerializerDto(FreelancerProfileDetailDto)
  async viewProfile(@Param('id', ParseIntPipe) id: number) {
    return this.profileService.viewProfile(id);
  }

  @Put(':id')
  @ZodSerializerDto(FreelancerProfileDetailDto)
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') currentUserId: number,
    @Body() body: UpdateFreelancerProfileDto,
  ) {
    return this.profileService.updateProfile(id, currentUserId, body);
  }

  @Get(':id/skills')
  @IsPublic()
  async getSkills(@Param('id', ParseIntPipe) id: number) {
    return this.profileService.getSkills(id);
  }

  @Post(':id/skills')
  @ZodSerializerDto(AddFreelancerSkillResponseDto)
  async addSkill(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') currentUserId: number,
    @Body() body: AddFreelancerSkillDto,
  ) {
    return this.profileService.addSkill(id, currentUserId, body);
  }

  @Delete('skills/:id')
  async deleteSkill(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') currentUserId: number,
  ) {
    return this.profileService.deleteSkill(id, currentUserId);
  }
}
