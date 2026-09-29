import {
  FreelancerProfileDetailSchema,
  UpdateFreelancerProfileSchema,
  UpdateFreelancerProfileResponseSchema,
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
