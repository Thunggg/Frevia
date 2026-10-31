import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  PermissionDetailResponseDto,
  PermissionFilterDto,
  PermissionListResponseDto,
} from './permissions.dto';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ZodSerializerDto(PermissionListResponseDto)
  getPermissions(@Query() query: PermissionFilterDto) {
    return this.permissionsService.getPermissions(query);
  }

  @Get(':id')
  @ZodSerializerDto(PermissionDetailResponseDto)
  getPermissionById(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.getPermissionById(id);
  }
}
