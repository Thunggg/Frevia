import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { IsPublic } from '../../shared/decorators/auth.decorator';
import { FreelancerProfileDetailResponseDto } from './profile.dto';
import { ProfileService } from './profile.service';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':id')
  @IsPublic()
  @ZodSerializerDto(FreelancerProfileDetailResponseDto)
  async getFreelancerProfile(@Param('id', ParseIntPipe) id: number) {
    return this.profileService.getFreelancerProfile(id);
  }
}
