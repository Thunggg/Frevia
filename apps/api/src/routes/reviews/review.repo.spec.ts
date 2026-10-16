import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { ReviewRepository } from './review.repo';

describe('ReviewRepository', () => {
  it('creates the review and recipient notification in one transaction', async () => {
    const createdReview = { id: 41 };
    const transaction = {
      review: { create: jest.fn().mockResolvedValue(createdReview) },
      notification: { create: jest.fn().mockResolvedValue({ id: 73 }) },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const repository = new ReviewRepository(prisma as unknown as PrismaService);

    await expect(
      repository.create(12, 3, 8, 'Jordan Tran', {
        overallRating: 4.5,
        breakdown: { communication: 5 },
        comment: 'Clear communication.',
      }),
    ).resolves.toBe(createdReview);

    expect(transaction.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 8,
        type: NotificationType.REVIEW_RECEIVED,
        title: 'You received a new review',
        message: 'Jordan Tran left you a review for contract #12.',
        data: {
          href: '/account-profile?tab=reviews&contractId=12',
          contractId: 12,
          reviewId: 41,
          reviewerId: 3,
        },
      },
    });
  });

  it('restores a deleted response and notifies the original reviewer atomically', async () => {
    const restoredResponse = { id: 52 };
    const transaction = {
      reviewResponse: {
        update: jest.fn().mockResolvedValue(restoredResponse),
        create: jest.fn(),
      },
      notification: { create: jest.fn().mockResolvedValue({ id: 74 }) },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const repository = new ReviewRepository(prisma as unknown as PrismaService);

    await expect(
      repository.createResponse(41, 8, 3, 12, 'Alex Nguyen', 'Thank you.', 52),
    ).resolves.toBe(restoredResponse);

    expect(transaction.reviewResponse.update).toHaveBeenCalledWith({
      where: { id: 52 },
      data: { userId: 8, responseText: 'Thank you.', deletedAt: null },
      include: expect.any(Object),
    });
    expect(transaction.reviewResponse.create).not.toHaveBeenCalled();
    expect(transaction.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 3,
        type: NotificationType.REVIEW_RESPONSE_RECEIVED,
        title: 'New response to your review',
        message: 'Alex Nguyen responded to your review.',
        data: {
          href: '/account-profile?tab=reviews&contractId=12',
          contractId: 12,
          reviewId: 41,
          responseId: 52,
          responderId: 8,
        },
      },
    });
  });
});
