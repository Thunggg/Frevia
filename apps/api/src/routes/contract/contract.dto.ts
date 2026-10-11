import {
  CreateContractBodySchema,
  CreateContractResponseSchema,
  UpdateContractBodySchema,
  UpdateContractResponseSchema,
  SignContractResponseSchema,
  GetContractListQuerySchema,
  GetContractListResponseSchema,
  ContractDetailSchema,
  CompleteContractResponseSchema,
  CancelContractResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class CreateContractBodyDTO extends createZodDto(
  CreateContractBodySchema,
) {}
export class CreateContractResponseDTO extends createZodDto(
  CreateContractResponseSchema,
) {}

export class UpdateContractBodyDTO extends createZodDto(
  UpdateContractBodySchema,
) {}
export class UpdateContractResponseDTO extends createZodDto(
  UpdateContractResponseSchema,
) {}

export class SignContractResponseDTO extends createZodDto(
  SignContractResponseSchema,
) {}

export class CompleteContractResponseDTO extends createZodDto(
  CompleteContractResponseSchema,
) {}
export class CancelContractResponseDTO extends createZodDto(
  CancelContractResponseSchema,
) {}

export class GetContractListQueryDTO extends createZodDto(
  GetContractListQuerySchema,
) {}
export class GetContractListResponseDTO extends createZodDto(
  GetContractListResponseSchema,
) {}
export class GetContractDetailResponseDTO extends createZodDto(
  ContractDetailSchema,
) {}
