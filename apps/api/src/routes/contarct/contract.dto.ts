import {
  CreateContractBodySchema,
  CreateContractResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class CreateContractBodyDTO extends createZodDto(
  CreateContractBodySchema,
) {}

export class CreateContractResponseDTO extends createZodDto(
  CreateContractResponseSchema,
) {}
