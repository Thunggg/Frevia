import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  CreatePermissionBodyDto,
  CreatePermissionResponseDto,
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

  @Post()
  @ZodSerializerDto(CreatePermissionResponseDto)
  createPermission(
    @Body() body: CreatePermissionBodyDto,
    @UserActive('userId') userId: number,
  ) {
    return this.permissionsService.createPermission(body, userId);
  }
}
