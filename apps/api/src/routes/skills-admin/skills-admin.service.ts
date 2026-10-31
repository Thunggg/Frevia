import { HttpException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  AdminCreateSkillBodyType,
  AdminUpdateSkillBodyType,
  SkillAdminDeleteResponseType,
  SkillAdminDetailResponseType,
  SkillAdminListResponseType,
  SkillAdminQueryType,
} from '@shared/types';
import {
  FailedToCreateSkillException,
  FailedToDeleteSkillException,
  FailedToLoadSkillDetailException,
  FailedToLoadSkillListException,
  FailedToRestoreSkillException,
  FailedToUpdateSkillException,
  SkillAdminNotFoundException,
  SkillNameAlreadyExistsException,
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

  // Tạo skill mới
  async createSkill(
    body: AdminCreateSkillBodyType,
  ): Promise<SkillAdminDetailResponseType> {
    try {
      return await this.repository.createSkill(body);
    } catch (error) {
      // Chống race condition khi 2 request tạo cùng lúc (vi phạm partial unique index)
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw SkillNameAlreadyExistsException();
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToCreateSkillException();
    }
  }

  // Cập nhật skill
  async updateSkill(
    id: number,
    body: AdminUpdateSkillBodyType,
  ): Promise<SkillAdminDetailResponseType> {
    try {
      return await this.repository.updateSkill(id, body);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw SkillNameAlreadyExistsException();
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToUpdateSkillException();
    }
  }

  // Xóa skill (soft delete)
  async deleteSkill(id: number): Promise<SkillAdminDeleteResponseType> {
    try {
      return await this.repository.deleteSkill(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToDeleteSkillException();
    }
  }

  // Khôi phục skill đã xóa
  async restoreSkill(id: number): Promise<SkillAdminDetailResponseType> {
    try {
      return await this.repository.restoreSkill(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToRestoreSkillException();
    }
  }
}
