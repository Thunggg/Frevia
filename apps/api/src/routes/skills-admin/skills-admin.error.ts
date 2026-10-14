import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

// ====== Exception cho trang Admin quản lý kỹ năng (Skill) ======

// Skill không tồn tại (hoặc đã bị xoá)
export const SkillAdminNotFoundException = () =>
  new NotFoundException([
    {
      message: 'Error.SkillNotFound',
      path: 'skillId',
    },
  ]);

export const FailedToLoadSkillListException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToLoadSkillList',
      path: 'skills',
    },
  ]);

export const FailedToLoadSkillDetailException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToLoadSkillDetail',
      path: 'skillId',
    },
  ]);

// Tên skill đã tồn tại (so sánh không phân biệt hoa thường, chỉ tính skill đang active)
export const SkillNameAlreadyExistsException = () =>
  new ConflictException([
    {
      message: 'Error.SkillNameAlreadyExists',
      path: 'name',
    },
  ]);

export const FailedToCreateSkillException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToCreateSkill',
      path: 'skill',
    },
  ]);

export const FailedToUpdateSkillException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToUpdateSkill',
      path: 'skill',
    },
  ]);
