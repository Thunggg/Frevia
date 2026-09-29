import { FreelancerProfileDetailSchema } from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class FreelancerProfileDetailResponseDto extends createZodDto(
  FreelancerProfileDetailSchema,
) {}
