import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  CreateRoleBodyDto,
  CreateRoleResponseDto,
  RoleDetailResponseDto,
  RoleListResponseDto,
} from './roles.dto';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ZodSerializerDto(RoleListResponseDto)
  getRoles() {
    return this.rolesService.getRoles();
  }

  @Get(':id')
  @ZodSerializerDto(RoleDetailResponseDto)
  getRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getRoleById(id);
  }

  @Post()
  @ZodSerializerDto(CreateRoleResponseDto)
  createRole(@Body() body: CreateRoleBodyDto) {
    return this.rolesService.createRole(body);
  }
}
