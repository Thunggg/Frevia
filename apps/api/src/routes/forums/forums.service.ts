import { Injectable } from '@nestjs/common';
import { PrismaClientValidationError } from '@prisma/client/runtime/client';
import { ForumCategoryListResponseType } from '@shared/types';
import { ServerErrorException } from '../../shared/errors/shared-message.error';
import { ForumRepository } from './forums.repo';

@Injectable()
export class ForumService {
  constructor(private readonly forumRepository: ForumRepository) {}

  async getForumCategories(): Promise<ForumCategoryListResponseType> {
    try {
      const categories = await this.forumRepository.getForumCategories();

      return { data: categories };
    } catch (error) {
      if (error instanceof PrismaClientValidationError) {
        throw ServerErrorException();
      }
      throw error;
    }
  }
}
