import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  PermissionDetailResponseDto,
  PermissionListResponseDto,
} from './permissions.dto';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ZodSerializerDto(PermissionListResponseDto)
  getPermissions() {
    return this.permissionsService.getPermissions();
  }

  @Get(':id')
  @ZodSerializerDto(PermissionDetailResponseDto)
  getPermissionById(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.getPermissionById(id);
  }
}
