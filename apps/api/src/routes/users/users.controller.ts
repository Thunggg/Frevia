import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import type { AdminCreateUserBodyType } from '@shared/types';
import {
  AdminCreateUserBodyDto,
  AdminCreateUserResponseDto,
  AdminUserDetailResponseDto,
  AdminUserListResponseDto,
  AdminUserQueryDto,
} from './users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  @ZodSerializerDto(AdminCreateUserResponseDto)
  createUser(@Body() body: AdminCreateUserBodyDto) {
    return this.service.createUser(body as AdminCreateUserBodyType);
  }

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
