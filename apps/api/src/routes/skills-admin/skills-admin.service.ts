import { HttpException, Injectable } from '@nestjs/common';
import {
  SkillAdminDetailResponseType,
  SkillAdminListResponseType,
  SkillAdminQueryType,
} from '@shared/types';
import {
  FailedToLoadSkillDetailException,
  FailedToLoadSkillListException,
  SkillAdminNotFoundException,
} from './skills-admin.error';
import { SkillsAdminRepository } from './skills-admin.repo';

@Injectable()
export class SkillsAdminService {
  constructor(private readonly repository: SkillsAdminRepository) {}

  // Lấy danh sách skill (phân trang + tìm kiếm + lọc active)
  async listSkills(
    query: SkillAdminQueryType,
  ): Promise<SkillAdminListResponseType> {
    try {
      return await this.repository.listSkills(query);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToLoadSkillListException();
    }
  }

  // Xem chi tiết 1 skill (kèm số job đang dùng)
  async getSkillDetail(id: number): Promise<SkillAdminDetailResponseType> {
    try {
      const skill = await this.repository.getSkillDetail(id);
      if (!skill) {
        throw SkillAdminNotFoundException();
      }
      return skill;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToLoadSkillDetailException();
    }
  }
}
