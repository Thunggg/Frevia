import { Controller, Get, Query } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../../shared/decorators/user-active.decorators';
import { ForumAdminService } from './forums-admin.service';
import {
  ForumAdminStatsResponseDto,
  ForumAdminCommentListResponseDto,
} from './forums-admin.dto';

@Controller('forums/admin')
export class ForumAdminController {
  constructor(private readonly adminService: ForumAdminService) {}

  @Get('stats')
  @ZodSerializerDto(ForumAdminStatsResponseDto)
  getAdminStats(@UserActive('roleName') roleName: string) {
    return this.adminService.getAdminStats(roleName);
  }

  @Get('comments')
  @ZodSerializerDto(ForumAdminCommentListResponseDto)
  getAdminCommentLists(
    @UserActive('roleName') roleName: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
  ) {
    return this.adminService.getAdminCommentLists(
      roleName,
      Number(page) || 1,
      Number(limit) || 10,
      search || undefined,
    );
  }
}
