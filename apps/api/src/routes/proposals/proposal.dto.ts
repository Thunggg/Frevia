import {
  CreateProposalBodySchema,
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
