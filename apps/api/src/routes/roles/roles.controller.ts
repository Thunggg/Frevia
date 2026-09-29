import { Controller, Get } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { RoleListResponseDto } from './roles.dto';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ZodSerializerDto(RoleListResponseDto)
  getRoles() {
    return this.rolesService.getRoles();
  }
}
