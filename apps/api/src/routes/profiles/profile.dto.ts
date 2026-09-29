import {
  FreelancerProfileDetailSchema,
  UpdateFreelancerProfileSchema,
  UpdateFreelancerProfileResponseSchema,
  FreelancerSkillListResponseSchema,
  AddFreelancerSkillSchema,
  AddFreelancerSkillResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class FreelancerProfileDetailResponseDto extends createZodDto(
  FreelancerProfileDetailSchema,
) {}

export class UpdateFreelancerProfileDto extends createZodDto(
  UpdateFreelancerProfileSchema,
) {}

export class UpdateFreelancerProfileResponseDto extends createZodDto(
  UpdateFreelancerProfileResponseSchema,
) {}

export class FreelancerSkillListResponseDto extends createZodDto(
  FreelancerSkillListResponseSchema,
) {}

export class AddFreelancerSkillDto extends createZodDto(
  AddFreelancerSkillSchema,
) {}

export class AddFreelancerSkillResponseDto extends createZodDto(
  AddFreelancerSkillResponseSchema,
) {}
