import { createZodDto } from 'nestjs-zod';
import {
  AddSocialLinkSchema,
  ClientProfileDetailSchema,
  FavoriteFreelancerSchema,
  FollowingFreelancerSchema,
  IdentityVerificationDocumentSchema,
  IdentityVerificationStatusSchema,
  SocialLinkSchema,
  UpdateClientProfileSchema,
  UploadIdentityDocumentSchema,
} from '@shared/types';
import { z } from 'zod';

export class UploadIdentityDocumentDto extends createZodDto(
  UploadIdentityDocumentSchema,
) {}
export class IdentityVerificationDocumentDto extends createZodDto(
  IdentityVerificationDocumentSchema,
) {}
export class IdentityVerificationStatusDto extends createZodDto(
  IdentityVerificationStatusSchema,
) {}
export class ClientProfileDetailDto extends createZodDto(
  ClientProfileDetailSchema,
) {}
export class UpdateClientProfileDto extends createZodDto(
  UpdateClientProfileSchema,
) {}
export class AddSocialLinkDto extends createZodDto(AddSocialLinkSchema) {}
export class SocialLinkDto extends createZodDto(SocialLinkSchema) {}
export class SocialLinkListDto extends createZodDto(
  z.array(SocialLinkSchema),
) {}
export class FavoriteFreelancerDto extends createZodDto(
  FavoriteFreelancerSchema,
) {}
export class FavoriteFreelancerListDto extends createZodDto(
  z.array(FavoriteFreelancerSchema),
) {}
export class FollowingFreelancerListDto extends createZodDto(
  z.array(FollowingFreelancerSchema),
) {}
