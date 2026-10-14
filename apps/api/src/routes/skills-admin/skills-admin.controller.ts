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
import type { SkillAdminQueryType } from '@shared/types';
import {
  CreateSkillBodyDto,
  SkillAdminDetailResponseDto,
  SkillAdminListResponseDto,
  SkillAdminQueryDto,
} from './skills-admin.dto';
import { SkillsAdminService } from './skills-admin.service';

// Trang Admin quản lý kỹ năng (Skill): danh sách + chi tiết + tạo mới
// Bảo mật: PermissionGuard tự chặn theo method+path; mặc định chỉ Admin có quyền.
@Controller('admin/skills')
export class SkillsAdminController {
  constructor(private readonly service: SkillsAdminService) {}

  @Get()
  @ZodSerializerDto(SkillAdminListResponseDto)
  listSkills(@Query() query: SkillAdminQueryDto) {
    return this.service.listSkills(query as SkillAdminQueryType);
  }

  @Post()
  @ZodSerializerDto(SkillAdminDetailResponseDto)
  createSkill(@Body() body: CreateSkillBodyDto) {
    return this.service.createSkill(body);
  }

  @Get(':id')
  @ZodSerializerDto(SkillAdminDetailResponseDto)
  getSkillDetail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getSkillDetail(id);
  }
}
