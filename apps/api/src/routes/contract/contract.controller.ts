import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  CancelContractResponseDTO,
  CompleteContractResponseDTO,
  CreateContractBodyDTO,
  CreateContractResponseDTO,
  GetContractDetailResponseDTO,
  GetContractListQueryDTO,
  GetContractListResponseDTO,
  SignContractResponseDTO,
  UpdateContractBodyDTO,
  UpdateContractResponseDTO,
} from './contract.dto';
import { ContractService } from './contract.service';
import type {
  CreateContractBodyType,
  GetContractListQueryType,
  UpdateContractBodyType,
} from '@shared/types';

@Controller('contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Get()
  @ZodSerializerDto(GetContractListResponseDTO)
  getContractList(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Query() query: GetContractListQueryDTO,
  ) {
    return this.contractService.getContractList(
      userId,
      roleName,
      query as GetContractListQueryType,
    );
  }

  @Get(':id')
  @ZodSerializerDto(GetContractDetailResponseDTO)
  getContractDetail(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('id', ParseIntPipe) contractId: number,
  ) {
    return this.contractService.getContractDetail(userId, roleName, contractId);
  }

  @Post()
  @ZodSerializerDto(CreateContractResponseDTO)
  createContract(
    @UserActive('userId') userId: number,
    @Body() body: CreateContractBodyDTO,
  ) {
    return this.contractService.createContract(
      userId,
      body as CreateContractBodyType,
    );
  }

  @Patch(':id')
  @ZodSerializerDto(UpdateContractResponseDTO)
  updateContract(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) contractId: number,
    @Body() body: UpdateContractBodyDTO,
  ) {
    return this.contractService.updateContract(
      userId,
      contractId,
      body as UpdateContractBodyType,
    );
  }

  @Patch(':id/sign')
  @ZodSerializerDto(SignContractResponseDTO)
  signContract(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) contractId: number,
  ) {
    return this.contractService.signContract(userId, contractId);
  }

  @Patch(':id/complete')
  @ZodSerializerDto(CompleteContractResponseDTO)
  completeContract(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) contractId: number,
  ) {
    return this.contractService.completeContract(userId, contractId);
  }

  @Patch(':id/cancel')
  @ZodSerializerDto(CancelContractResponseDTO)
  cancelContract(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) contractId: number,
  ) {
    return this.contractService.cancelContract(userId, contractId);
  }
}
