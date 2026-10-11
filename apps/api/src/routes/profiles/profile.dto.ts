import { createZodDto } from 'nestjs-zod';
import {
  UpdateFreelancerProfileSchema,
  FreelancerProfileDetailSchema,
  AddFreelancerSkillSchema,
  AddFreelancerSkillResponseSchema,
} from '@shared/types';

export class UpdateFreelancerProfileDto extends createZodDto(
  UpdateFreelancerProfileSchema,
) {}

export class FreelancerProfileDetailDto extends createZodDto(
  FreelancerProfileDetailSchema,
) {}

export class AddFreelancerSkillDto extends createZodDto(
  AddFreelancerSkillSchema,
) {}

export class AddFreelancerSkillResponseDto extends createZodDto(
  AddFreelancerSkillResponseSchema,
) {}
