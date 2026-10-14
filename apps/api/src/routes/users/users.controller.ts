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
import type {
  AdminCreateUserBodyType,
  AdminUpdateUserBodyType,
} from '@shared/types';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  AdminCreateUserBodyDto,
  AdminCreateUserResponseDto,
  AdminUpdateUserBodyDto,
  AdminUpdateUserResponseDto,
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

  @Patch(':id')
  @ZodSerializerDto(AdminUpdateUserResponseDto)
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @UserActive('userId') actorId: number,
    @Body() body: AdminUpdateUserBodyDto,
  ) {
    return this.service.updateUser(
      id,
      actorId,
      body as AdminUpdateUserBodyType,
    );
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
