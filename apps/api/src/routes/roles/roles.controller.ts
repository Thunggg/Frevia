import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  CreateRoleBodyDto,
  CreateRoleResponseDto,
  DeleteRoleResponseDto,
  RoleDetailResponseDto,
  RoleListResponseDto,
  UpdateRoleBodyDto,
  UpdateRoleResponseDto,
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

  @Patch(':id')
  @ZodSerializerDto(UpdateRoleResponseDto)
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateRoleBodyDto,
  ) {
    return this.rolesService.updateRole(id, body);
  }

  @Delete(':id')
  @ZodSerializerDto(DeleteRoleResponseDto)
  deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.deleteRole(id);
  }
}
