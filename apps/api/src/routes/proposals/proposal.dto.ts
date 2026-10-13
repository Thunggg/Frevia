import {
  CreateProposalBodySchema,
  MyProposalsQuerySchema,
  MyProposalsResponseSchema,
  ProposalDetailSchema,
  ProposalSchema,
  SaveProposalDraftBodySchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class CreateProposalBodyDto extends createZodDto(
  CreateProposalBodySchema,
) {}

export class SaveProposalDraftBodyDto extends createZodDto(
  SaveProposalDraftBodySchema,
) {}

export class ProposalResponseDto extends createZodDto(ProposalSchema) {}

export class MyProposalsQueryDto extends createZodDto(MyProposalsQuerySchema) {}
export class MyProposalsResponseDto extends createZodDto(
  MyProposalsResponseSchema,
) {}
export class ProposalDetailResponseDto extends createZodDto(
  ProposalDetailSchema,
) {}
