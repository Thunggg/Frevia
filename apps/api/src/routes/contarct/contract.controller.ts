import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  CompleteContractResponseDTO,
  CreateContractBodyDTO,
  CreateContractResponseDTO,
  UpdateContractTermsBodyDTO,
  UpdateContractTermsResponseDTO,
} from './contract.dto';
import { ContractService } from './contract.service';
import type { CreateContractBodyType, UpdateContractTermsBodyType } from '@shared/types';

@Controller('api/contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) { }

  @Post()
  @ZodSerializerDto(CreateContractResponseDTO)
  createContract(
    @UserActive('userId') userId: number,
    @Body() body: CreateContractBodyDTO,
  ) {
    return this.contractService.createContract(userId, body as CreateContractBodyType);
  }

  @Patch(':id/terms')
  @ZodSerializerDto(UpdateContractTermsResponseDTO)
  updateContractTerms(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') userId: number,
    @Body() body: UpdateContractTermsBodyDTO,
  ) {
    return this.contractService.updateContractTerms(
      id,
      userId,
      body as UpdateContractTermsBodyType,
    );
  }

  @Patch(':id/complete')
  @ZodSerializerDto(CompleteContractResponseDTO)
  completeContract(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') userId: number,
  ) {
    return this.contractService.completeContract(id, userId);
  }
}
