import { Body, Controller, Get } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { ForumCategoryListResponseDto } from './forums.dto';
import { ForumService } from './forums.service';

/**
 * ForumController - Xử lý HTTP requests cho Forum Module
 * Tất cả routes đều có prefix /api
 */
@Controller('api/forums')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  /**
   * UC-04.1: View Forum Categories
   * GET /api/forum/categories
   * Lấy danh sách tất cả forum categories đang active
   * @returns Danh sách forum categories
   */
  @Get('categories')
  @ZodSerializerDto(ForumCategoryListResponseDto)
  getForumCategories() {
    return this.forumService.getForumCategories();
  }
}
