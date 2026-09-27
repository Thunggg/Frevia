import { NotFoundException } from '@nestjs/common';
import { ManageForumMessages } from '@shared/types';

// Lỗi khi không tìm thấy forum category
export const ForumCategoryNotFoundException = () =>
  new NotFoundException([
    { message: ManageForumMessages.FORUM_CATEGORY_NOT_FOUND, path: 'id' },
  ]);
