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
  GetContractFilesResponseDTO,
  GetContractsQueryDTO,
  GetContractsResponseDTO,
  SignContractResponseDTO,
  UpdateContractTermsBodyDTO,
  UpdateContractTermsResponseDTO,
  UploadContractFileBodyDTO,
  UploadContractFileResponseDTO,
} from './contract.dto';
import { ContractService } from './contract.service';
import type { CreateContractBodyType, GetContractsQueryType, UpdateContractTermsBodyType, UploadContractFileBodyType } from '@shared/types';

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

  @Patch(':id/sign')
  @ZodSerializerDto(SignContractResponseDTO)
  signContract(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') userId: number,
  ) {
    return this.contractService.signContract(id, userId);
  }

  @Patch(':id/cancel')
  @ZodSerializerDto(CancelContractResponseDTO)
  cancelContract(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') userId: number,
  ) {
    return this.contractService.cancelContract(id, userId);
  }

  @Get()
  @ZodSerializerDto(GetContractsResponseDTO)
  getContracts(
    @Query() query: GetContractsQueryDTO,
    @UserActive('userId') userId: number,
  ) {
    return this.contractService.getContracts(query as GetContractsQueryType, userId);
  }

  @Get(':id')
  @ZodSerializerDto(GetContractDetailResponseDTO)
  getContractDetail(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') userId: number,
  ) {
    return this.contractService.getContractDetail(id, userId);
  }

  @Get(':id/files')
  @ZodSerializerDto(GetContractFilesResponseDTO)
  getContractFiles(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') userId: number,
  ) {
    return this.contractService.getContractFiles(id, userId);
  }

  @Post(':id/files')
  @ZodSerializerDto(UploadContractFileResponseDTO)
  uploadContractFile(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') userId: number,
    @Body() body: UploadContractFileBodyDTO,
  ) {
    return this.contractService.uploadContractFile(id, userId, body as UploadContractFileBodyType);
  }
}
