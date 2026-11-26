import { Prisma } from '@prisma/client';
import { FreelancerReviewsQuerySchema, RoleName } from '@shared/types';
import {
  isHardcodedMarketplaceAllowed,
  isAdminPermissionPath,
} from '../../shared/helper/admin-permission';
import { PrismaService } from '../../shared/services/prisma.service';
import { ReviewRepository } from './review.repo';
import { ReviewService } from './review.service';

describe('Freelancer profile reviews', () => {
  it('bounds pagination and rejects invalid input', () => {
    expect(FreelancerReviewsQuerySchema.parse({})).toEqual({
      page: 1,
      limit: 5,
    });
    for (const input of [
      { page: 0 },
      { page: 1.5 },
      { limit: 21 },
      { limit: -1 },
      { page: 'abc' },
    ]) {
      expect(FreelancerReviewsQuerySchema.safeParse(input).success).toBe(false);
    }
  });

  it('uses the same recipient and deletion filters for the page and summary', async () => {
    const prisma = {
      review: {
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn((queries: Promise<unknown>[]) =>
        Promise.all(queries),
      ),
    };
    await new ReviewRepository(
      prisma as unknown as PrismaService,
    ).listForFreelancer(42, 2, 5);
    const where = {
      revieweeId: 42,
      reviewerId: { not: 42 },
      deletedAt: null,
      contract: { freelancerId: 42, deletedAt: null },
    };
    expect(prisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where,
        skip: 5,
        take: 5,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
    expect(prisma.review.aggregate).toHaveBeenCalledWith({
      where,
      _count: { _all: true },
      _avg: { overallRating: true },
    });
  });

  it('hides deleted responses and exposes only display metadata', async () => {
    const row = {
      id: 1,
      overallRating: new Prisma.Decimal('4.5'),
      comment: null,
      createdAt: new Date(),
      reviewer: { profile: { displayName: 'Client', avatarUrl: null } },
      response: { responseText: 'Removed', deletedAt: new Date() },
    };
    const repository = {
      listForFreelancer: jest
        .fn()
        .mockResolvedValue([
          [
            row,
            {
              ...row,
              id: 2,
              response: { responseText: 'Thanks', deletedAt: null },
            },
          ],
          {
            _count: { _all: 7 },
            _avg: { overallRating: new Prisma.Decimal('4.5') },
          },
        ]),
    };
    const result = await new ReviewService(
      repository as unknown as ReviewRepository,
    ).listForFreelancer(42, { page: 1, limit: 5 });
    expect(result.total).toBe(7);
    expect(result.avgRating).toBe(4.5);
    expect(result.reviews[0]).toEqual({
      id: 1,
      overallRating: 4.5,
      comment: null,
      createdAt: row.createdAt,
      reviewer: row.reviewer.profile,
      response: null,
    });
    expect(result.reviews[1].response).toEqual({ responseText: 'Thanks' });
  });

  it('returns an unrated empty state', async () => {
    const repository = {
      listForFreelancer: jest
        .fn()
        .mockResolvedValue([
          [],
          { _count: { _all: 0 }, _avg: { overallRating: null } },
        ]),
    };
    expect(
      await new ReviewService(
        repository as unknown as ReviewRepository,
      ).listForFreelancer(42, { page: 1, limit: 5 }),
    ).toEqual({ reviews: [], total: 0, avgRating: null, page: 1, limit: 5 });
  });

  it('permits marketplace readers without opening an admin route', () => {
    const path = '/api/reviews/freelancers/42';
    expect(isHardcodedMarketplaceAllowed(RoleName.CLIENT, 'GET', path)).toBe(
      true,
    );
    expect(
      isHardcodedMarketplaceAllowed(RoleName.FREELANCER, 'GET', path),
    ).toBe(true);
    expect(isHardcodedMarketplaceAllowed(RoleName.ADMIN, 'GET', path)).toBe(
      false,
    );
    expect(isAdminPermissionPath(path, 'GET')).toBe(false);
  });
});
