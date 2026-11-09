import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  CreateSavedSearchBodyType,
  GetSavedSearchesQueryType,
  MAX_SAVED_SEARCHES_PER_USER,
  SavedSearchType,
  UpdateSavedSearchBodyType,
} from '@shared/types';
import {
  FailedToCreateSavedSearchException,
  FailedToLoadSavedSearchException,
  SavedSearchLimitExceededException,
  SavedSearchNotFoundException,
} from './saved-search.error';
import { SavedSearchRepository } from './saved-search.repo';

@Injectable()
export class SavedSearchService {
  constructor(private readonly savedSearchRepository: SavedSearchRepository) {}

  async getSavedSearches(
    userId: number,
    query?: GetSavedSearchesQueryType,
  ): Promise<SavedSearchType[]> {
    try {
      return await this.savedSearchRepository.findAllByUserId(userId, query);
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
    const currentCount = await this.savedSearchRepository.countByUserId(userId);
    if (currentCount >= MAX_SAVED_SEARCHES_PER_USER) {
      throw SavedSearchLimitExceededException();
    }
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
