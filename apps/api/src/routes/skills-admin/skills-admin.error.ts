import {
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
