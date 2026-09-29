import { Body, Controller, Post } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import { CreateContractBodyDTO, CreateContractResponseDTO } from './contract.dto';
import { ContractService } from './contract.service';
import type { CreateContractBodyType } from '@shared/types';

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
}
