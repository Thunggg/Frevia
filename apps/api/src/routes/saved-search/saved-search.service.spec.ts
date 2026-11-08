import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import type { SavedSearchType } from '@shared/types';
import {
  FailedToCreateSavedSearchException,
  FailedToLoadSavedSearchException,
  SavedSearchLimitExceededException,
  SavedSearchNotFoundException,
} from './saved-search.error';
import type { SavedSearchRepository } from './saved-search.repo';
import { SavedSearchService } from './saved-search.service';

const mockSavedSearch: SavedSearchType = {
  id: 1,
  userId: 10,
  name: 'React Developer Jobs',
  searchParams: { keyword: 'react', budget: '100-500' },
  createdAt: new Date('2026-03-01T10:00:00Z'),
};

describe('SavedSearchService (UC-22)', () => {
  let repository: {
    countByUserId: jest.Mock;
    findAllByUserId: jest.Mock;
    findByIdAndUserId: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let service: SavedSearchService;

  beforeEach(() => {
    repository = {
      countByUserId: jest.fn().mockResolvedValue(0),
      findAllByUserId: jest.fn().mockResolvedValue([mockSavedSearch]),
      findByIdAndUserId: jest.fn().mockResolvedValue(mockSavedSearch),
      create: jest.fn().mockResolvedValue(mockSavedSearch),
      update: jest.fn().mockResolvedValue(mockSavedSearch),
      delete: jest.fn().mockResolvedValue(true),
    };

    service = new SavedSearchService(
      repository as unknown as SavedSearchRepository,
    );
  });

  describe('UC-22.01: View Saved Search List', () => {
    it('returns saved searches for the user', async () => {
      const result = await service.getSavedSearches(10);
      expect(result).toEqual([mockSavedSearch]);
      expect(repository.findAllByUserId).toHaveBeenCalledWith(10, undefined);
    });

    it('passes search query and order options if provided', async () => {
      const query = { search: 'react', order: 'asc' as const };
      await service.getSavedSearches(10, query);
      expect(repository.findAllByUserId).toHaveBeenCalledWith(10, query);
    });

    it('throws FailedToLoadSavedSearchException on Prisma error', async () => {
      repository.findAllByUserId.mockRejectedValue(
        new PrismaClientKnownRequestError('db error', {
          code: 'P2000',
          clientVersion: '1',
        }),
      );
      await expect(service.getSavedSearches(10)).rejects.toThrow(
        FailedToLoadSavedSearchException(),
      );
    });
  });

  describe('UC-22.02: View Saved Search Detail', () => {
    it('returns saved search detail when owned by user', async () => {
      const result = await service.getSavedSearchDetail(10, 1);
      expect(result).toEqual(mockSavedSearch);
      expect(repository.findByIdAndUserId).toHaveBeenCalledWith(1, 10);
    });

    it('throws SavedSearchNotFoundException when not found or not owned', async () => {
      repository.findByIdAndUserId.mockResolvedValue(null);
      await expect(service.getSavedSearchDetail(10, 999)).rejects.toThrow(
        SavedSearchNotFoundException(),
      );
    });

    it('throws FailedToLoadSavedSearchException on database error', async () => {
      repository.findByIdAndUserId.mockRejectedValue(
        new PrismaClientKnownRequestError('db error', {
          code: 'P2000',
          clientVersion: '1',
        }),
      );
      await expect(service.getSavedSearchDetail(10, 1)).rejects.toThrow(
        FailedToLoadSavedSearchException(),
      );
    });
  });

  describe('UC-22.03: Create Saved Search', () => {
    it('creates a new saved search successfully', async () => {
      const payload = {
        name: 'Node.js Fullstack',
        searchParams: { keyword: 'node', sort: 'newest' },
      };
      const result = await service.createSavedSearch(10, payload);
      expect(result).toEqual(mockSavedSearch);
      expect(repository.create).toHaveBeenCalledWith(10, payload);
    });

    it('throws SavedSearchLimitExceededException when user already has 30 saved searches', async () => {
      repository.countByUserId.mockResolvedValue(30);
      await expect(
        service.createSavedSearch(10, {
          name: 'Exceeding search',
          searchParams: {},
        }),
      ).rejects.toThrow(SavedSearchLimitExceededException());
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('throws FailedToCreateSavedSearchException on database error', async () => {
      repository.create.mockRejectedValue(
        new PrismaClientKnownRequestError('db error', {
          code: 'P2002',
          clientVersion: '1',
        }),
      );
      await expect(
        service.createSavedSearch(10, {
          name: 'Test',
          searchParams: {},
        }),
      ).rejects.toThrow(FailedToCreateSavedSearchException());
    });
  });

  describe('UC-22.04: Update Saved Search', () => {
    it('updates name and/or searchParams successfully', async () => {
      const updatePayload = {
        name: 'Updated Name',
        searchParams: { keyword: 'nextjs' },
      };
      const result = await service.updateSavedSearch(10, 1, updatePayload);
      expect(result).toEqual(mockSavedSearch);
      expect(repository.update).toHaveBeenCalledWith(1, 10, updatePayload);
    });

    it('throws SavedSearchNotFoundException when record not found or not owned', async () => {
      repository.update.mockResolvedValue(null);
      await expect(
        service.updateSavedSearch(10, 999, { name: 'Rename' }),
      ).rejects.toThrow(SavedSearchNotFoundException());
    });
  });

  describe('UC-22.05: Delete Saved Search', () => {
    it('deletes saved search successfully', async () => {
      await expect(service.deleteSavedSearch(10, 1)).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith(1, 10);
    });

    it('throws SavedSearchNotFoundException if record does not exist or not owned', async () => {
      repository.delete.mockResolvedValue(false);
      await expect(service.deleteSavedSearch(10, 999)).rejects.toThrow(
        SavedSearchNotFoundException(),
      );
    });
  });
});
