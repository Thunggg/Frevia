import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { IsPublic } from '../../shared/decorators/auth.decorator';
import {
  ForumCategoryDetailResponseDto,
  ForumCategoryListResponseDto,
} from './forums.dto';
import { ForumService } from './forums.service';

@Controller('api/forums')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Get('categories')
  @IsPublic() // Dùng cho các API không cần phải đăng nhập
  @ZodSerializerDto(ForumCategoryListResponseDto)
  getForumCategories() {
    return this.forumService.getForumCategories();
  }

  @Get('categories/:id')
  @IsPublic()
  @ZodSerializerDto(ForumCategoryDetailResponseDto)
  getForumCategoryById(@Param('id', ParseIntPipe) id: number) {
    return this.forumService.getForumCategoryById(id);
  }
}
