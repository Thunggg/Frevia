import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  AdminUserDetailResponseDto,
  AdminUserListResponseDto,
  AdminUserQueryDto,
} from './users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @ZodSerializerDto(AdminUserListResponseDto)
  getUsers(@Query() query: AdminUserQueryDto) {
    return this.service.getUsers(query);
  }

  @Get(':id')
  @ZodSerializerDto(AdminUserDetailResponseDto)
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getUserById(id);
  }
}
