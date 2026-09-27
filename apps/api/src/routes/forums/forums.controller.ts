import { Controller, Get } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { IsPublic } from '../../shared/decorators/auth.decorator';
import { ForumCategoryListResponseDto } from './forums.dto';
import { ForumService } from './forums.service';

@Controller('api/forums')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Get('categories')
  // UC-04.1: View Forum Categories
  // GET /api/forums/categories
  // Lấy danh sách tất cả forum categories đang active
  // @returns Danh sách forum categories
  @IsPublic() // Dùng cho các API không cần phải đăng nhập
  @ZodSerializerDto(ForumCategoryListResponseDto)
  getForumCategories() {
    return this.forumService.getForumCategories();
  }
}
