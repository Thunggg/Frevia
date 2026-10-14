import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import type { SkillAdminQueryType } from '@shared/types';
import {
  SkillAdminDetailResponseDto,
  SkillAdminListResponseDto,
  SkillAdminQueryDto,
} from './skills-admin.dto';
import { SkillsAdminService } from './skills-admin.service';

// Trang Admin quản lý kỹ năng (Skill): danh sách + chi tiết (read-only hiện tại)
// Bảo mật: PermissionGuard tự chặn theo method+path; mặc định chỉ Admin có quyền.
@Controller('admin/skills')
export class SkillsAdminController {
  constructor(private readonly service: SkillsAdminService) {}

  @Get()
  @ZodSerializerDto(SkillAdminListResponseDto)
  listSkills(@Query() query: SkillAdminQueryDto) {
    return this.service.listSkills(query as SkillAdminQueryType);
  }

  @Get(':id')
  @ZodSerializerDto(SkillAdminDetailResponseDto)
  getSkillDetail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getSkillDetail(id);
  }
}
