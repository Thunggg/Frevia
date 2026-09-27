import { Injectable } from '@nestjs/common';
import { ForumCategoryListResponseType } from '@shared/types';
import { ForumRepository } from './forums.repo';
import { FailedToLoadForumCategoriesException } from './forums.error';

@Injectable()
export class ForumService {
  // Inject ForumRepository để Service có thể lấy dữ liệu từ database
  constructor(private readonly forumRepository: ForumRepository) {}

  // Lấy danh sách tất cả forum categories
  async getForumCategories(): Promise<ForumCategoryListResponseType> {
    try {
      // Gọi Repository để truy vấn dữ liệu từ database
      const categories = await this.forumRepository.getForumCategories();

      // Trả dữ liệu về theo đúng format của API
      return {
        data: categories,
      };
    } catch {
      // Nếu có lỗi khi truy vấn database thì trả về exception
      throw FailedToLoadForumCategoriesException();
    }
  }
}
