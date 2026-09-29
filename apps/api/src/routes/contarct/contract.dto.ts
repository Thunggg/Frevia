import {
  CancelContractResponseSchema,
  CompleteContractResponseSchema,
  CreateContractBodySchema,
  CreateContractResponseSchema,
  GetContractDetailResponseSchema,
  GetContractFilesResponseSchema,
  GetContractsQuerySchema,
  GetContractsResponseSchema,
  SignContractResponseSchema,
  UpdateContractTermsBodySchema,
  UpdateContractTermsResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class CreateContractBodyDTO extends createZodDto(CreateContractBodySchema) { }
export class CreateContractResponseDTO extends createZodDto(CreateContractResponseSchema) { }

export class UpdateContractTermsBodyDTO extends createZodDto(UpdateContractTermsBodySchema) { }
export class UpdateContractTermsResponseDTO extends createZodDto(UpdateContractTermsResponseSchema) { }

export class CompleteContractResponseDTO extends createZodDto(CompleteContractResponseSchema) { }
export class SignContractResponseDTO extends createZodDto(SignContractResponseSchema) { }
export class CancelContractResponseDTO extends createZodDto(CancelContractResponseSchema) { }

export class GetContractsQueryDTO extends createZodDto(GetContractsQuerySchema) { }
export class GetContractsResponseDTO extends createZodDto(GetContractsResponseSchema) { }
export class GetContractDetailResponseDTO extends createZodDto(GetContractDetailResponseSchema) { }

export class GetContractFilesResponseDTO extends createZodDto(GetContractFilesResponseSchema) { }
