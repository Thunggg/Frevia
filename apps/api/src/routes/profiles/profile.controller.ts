import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  Put,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type {
  AddFreelancerSkillType,
  UpdateFreelancerProfileType,
} from '@shared/types';
import { ZodSerializerDto } from 'nestjs-zod';
import { IsPublic } from '../../shared/decorators/auth.decorator';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import { ProfileService } from './profile.service';
import {
  UpdateFreelancerProfileDto,
  FreelancerProfileDetailDto,
  AddFreelancerSkillDto,
  AddFreelancerSkillResponseDto,
  CvUploadResponseDto,
  CvAnalyzeResponseDto,
  ProfileRevisionSubmissionDto,
} from './profile.dto';
import { UseInterceptors } from '@nestjs/common';
import { createReadStream } from 'fs';
import type { Response } from 'express';

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
  @ZodSerializerDto(ProfileRevisionSubmissionDto)
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') currentUserId: number,
    @Body() body: UpdateFreelancerProfileDto,
  ) {
    return this.profileService.updateProfile(
      id,
      currentUserId,
      body as UpdateFreelancerProfileType,
    );
  }

  @Post(':id/cv')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @ZodSerializerDto(CvUploadResponseDto)
  uploadCv(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') currentUserId: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.profileService.uploadCv(id, currentUserId, file);
  }

  @Get(':id/cv/file')
  async getCvFile(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') currentUserId: number,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.profileService.getCvFile(id, currentUserId);
    if (file.remoteUrl) {
      return response.redirect(file.remoteUrl);
    }
    if (!file.absolutePath) {
      throw new Error('CV file path is unavailable.');
    }
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName.replace(/"/g, '')}"`,
    );
    response.setHeader('Content-Type', 'application/pdf');
    return new StreamableFile(createReadStream(file.absolutePath));
  }

  @Post(':id/cv/analyze')
  @ZodSerializerDto(CvAnalyzeResponseDto)
  analyzeCv(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') currentUserId: number,
  ) {
    return this.profileService.analyzeCv(id, currentUserId);
  }

  @Delete(':id/cv')
  deleteCv(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') currentUserId: number,
  ) {
    return this.profileService.deleteCv(id, currentUserId);
  }

  @Get(':id/skills')
  @IsPublic()
  async getSkills(@Param('id', ParseIntPipe) id: number) {
    return this.profileService.getSkills(id);
  }

  @Get('skills/suggestions')
  async searchSkillSuggestions(@Query('search') search?: string) {
    return this.profileService.searchSkillSuggestions(search);
  }

  @Post(':id/skills')
  @ZodSerializerDto(AddFreelancerSkillResponseDto)
  async addSkill(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') currentUserId: number,
    @Body() body: AddFreelancerSkillDto,
  ) {
    return this.profileService.addSkill(
      id,
      currentUserId,
      body as AddFreelancerSkillType,
    );
  }

  @Delete('skills/:id')
  async deleteSkill(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') currentUserId: number,
  ) {
    return this.profileService.deleteSkill(id, currentUserId);
  }
}
