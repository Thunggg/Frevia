import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  CreateSavedSearchBodyType,
  SavedSearchType,
  UpdateSavedSearchBodyType,
} from '@shared/types';
import {
  FailedToCreateSavedSearchException,
  FailedToLoadSavedSearchException,
  SavedSearchNotFoundException,
} from './saved-search.error';
import { SavedSearchRepository } from './saved-search.repo';

@Injectable()
export class SavedSearchService {
  constructor(private readonly savedSearchRepository: SavedSearchRepository) {}

  async getSavedSearches(userId: number): Promise<SavedSearchType[]> {
    try {
      return await this.savedSearchRepository.findAllByUserId(userId);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToLoadSavedSearchException();
      }
      throw error;
    }
  }

  async getSavedSearchDetail(
    userId: number,
    id: number,
  ): Promise<SavedSearchType> {
    try {
      const savedSearch = await this.savedSearchRepository.findByIdAndUserId(
        id,
        userId,
      );
      if (!savedSearch) throw SavedSearchNotFoundException();
      return savedSearch;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToLoadSavedSearchException();
      }
      throw error;
    }
  }

  async createSavedSearch(
    userId: number,
    body: CreateSavedSearchBodyType,
  ): Promise<SavedSearchType> {
    try {
      return await this.savedSearchRepository.create(userId, body);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToCreateSavedSearchException();
      }
      throw error;
    }
  }

  async updateSavedSearch(
    userId: number,
    id: number,
    body: UpdateSavedSearchBodyType,
  ): Promise<SavedSearchType> {
    const savedSearch = await this.savedSearchRepository.update(
      id,
      userId,
      body,
    );
    if (!savedSearch) throw SavedSearchNotFoundException();
    return savedSearch;
  }

  async deleteSavedSearch(userId: number, id: number): Promise<void> {
    const deleted = await this.savedSearchRepository.delete(id, userId);
    if (!deleted) throw SavedSearchNotFoundException();
  }
}
