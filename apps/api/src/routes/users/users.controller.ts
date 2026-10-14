import { Controller, Get, Query } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import { AdminUserListResponseDto, AdminUserQueryDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @ZodSerializerDto(AdminUserListResponseDto)
  getUsers(
    @UserActive('roleName') roleName: string,
    @Query() query: AdminUserQueryDto,
  ) {
    return this.service.getUsers(roleName, query);
  }
}
