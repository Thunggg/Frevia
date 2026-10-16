import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ReviewRepository } from './review.repo';
import { ReviewService } from './review.service';

const contract = { id: 9, clientId: 1, freelancerId: 2 };
const review = {
  id: 4,
  contractId: 9,
  reviewerId: 1,
  revieweeId: 2,
  overallRating: { toString: () => '4.5' },
};

describe('ReviewService', () => {
  const repository = {
    findContract: jest.fn(),
    findById: jest.fn(),
    findByContractAndReviewer: jest.fn(),
    findManyByContract: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    findResponseByReview: jest.fn(),
    findResponseById: jest.fn(),
    createResponse: jest.fn(),
    updateResponse: jest.fn(),
    softDeleteResponse: jest.fn(),
  };
  const service = new ReviewService(repository as unknown as ReviewRepository);

  beforeEach(() => jest.clearAllMocks());

  it('derives the reviewee from the contract participant', async () => {
    repository.findContract.mockResolvedValue(contract);
    repository.findByContractAndReviewer.mockResolvedValue(null);
    repository.create.mockResolvedValue(review);

    await service.create(1, 9, {
      overallRating: 4.5,
      breakdown: { quality: 5 },
      comment: 'Great work',
    });

    expect(repository.create).toHaveBeenCalledWith(
      9,
      1,
      2,
      expect.objectContaining({ overallRating: 4.5 }),
    );
  });

  it('rejects a user who is not a contract participant', async () => {
    repository.findContract.mockResolvedValue(contract);

    await expect(service.list(8, 9)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a second review from the same participant', async () => {
    repository.findContract.mockResolvedValue(contract);
    repository.findByContractAndReviewer.mockResolvedValue({ id: 4 });

    await expect(
      service.create(1, 9, { overallRating: 5 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('only lets the reviewer update a review', async () => {
    repository.findById.mockResolvedValue(review);

    await expect(
      service.update(2, 4, { comment: 'Changed' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('only lets the reviewee respond', async () => {
    repository.findById.mockResolvedValue(review);

    await expect(service.respond(1, 4, 'Thank you')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('soft deletes an owned response', async () => {
    repository.findResponseById.mockResolvedValue({
      id: 5,
      reviewId: 4,
      userId: 2,
    });

    await service.removeResponse(2, 5);

    expect(repository.softDeleteResponse).toHaveBeenCalledWith(5);
  });
});
