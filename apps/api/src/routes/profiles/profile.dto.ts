import { createZodDto } from 'nestjs-zod';
import {
  UpdateFreelancerProfileSchema,
  FreelancerProfileDetailSchema,
  AddFreelancerSkillSchema,
  AddFreelancerSkillResponseSchema,
  ProfileRevisionSubmissionSchema,
} from '@shared/types';

export class UpdateFreelancerProfileDto extends createZodDto(
  UpdateFreelancerProfileSchema,
) {}

export class FreelancerProfileDetailDto extends createZodDto(
  FreelancerProfileDetailSchema,
) {}

export class ProfileRevisionSubmissionDto extends createZodDto(
  ProfileRevisionSubmissionSchema,
) {}

export class AddFreelancerSkillDto extends createZodDto(
  AddFreelancerSkillSchema,
) {}

export class AddFreelancerSkillResponseDto extends createZodDto(
  AddFreelancerSkillResponseSchema,
) {}
