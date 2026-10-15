import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CreateReviewType, UpdateReviewType } from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';

const reviewSelect = {
  id: true,
  contractId: true,
  reviewerId: true,
  revieweeId: true,
  overallRating: true,
  breakdown: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  reviewer: {
    select: {
      id: true,
      email: true,
      profile: { select: { displayName: true, avatarUrl: true } },
    },
  },
  reviewee: {
    select: {
      id: true,
      email: true,
      profile: { select: { displayName: true, avatarUrl: true } },
    },
  },
  response: {
    select: {
      id: true,
      reviewId: true,
      userId: true,
      responseText: true,
      createdAt: true,
      deletedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      },
    },
  },
} satisfies Prisma.ReviewSelect;

@Injectable()
export class ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  findContract(contractId: number) {
    return this.prisma.contract.findFirst({
      where: { id: contractId, deletedAt: null },
      select: { id: true, clientId: true, freelancerId: true },
    });
  }

  findById(reviewId: number, includeDeleted = false) {
    return this.prisma.review.findFirst({
      where: { id: reviewId, ...(includeDeleted ? {} : { deletedAt: null }) },
      select: reviewSelect,
    });
  }

  findByContractAndReviewer(contractId: number, reviewerId: number) {
    return this.prisma.review.findUnique({
      where: { contractId_reviewerId: { contractId, reviewerId } },
      select: { id: true },
    });
  }

  findManyByContract(contractId: number) {
    return this.prisma.review.findMany({
      where: { contractId, deletedAt: null },
      select: reviewSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  create(
    contractId: number,
    reviewerId: number,
    revieweeId: number,
    input: CreateReviewType,
  ) {
    return this.prisma.review.create({
      data: {
        contractId,
        reviewerId,
        revieweeId,
        overallRating: input.overallRating,
        breakdown: input.breakdown ?? Prisma.JsonNull,
        comment: input.comment ?? null,
      },
      select: reviewSelect,
    });
  }

  update(reviewId: number, input: UpdateReviewType) {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(input.overallRating !== undefined && {
          overallRating: input.overallRating,
        }),
        ...(input.breakdown !== undefined && {
          breakdown: input.breakdown ?? Prisma.JsonNull,
        }),
        ...(input.comment !== undefined && { comment: input.comment }),
      },
      select: reviewSelect,
    });
  }

  softDelete(reviewId: number) {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { deletedAt: new Date() },
    });
  }

  findResponseByReview(reviewId: number) {
    return this.prisma.reviewResponse.findUnique({
      where: { reviewId },
      select: { id: true, deletedAt: true },
    });
  }

  findResponseById(responseId: number) {
    return this.prisma.reviewResponse.findFirst({
      where: { id: responseId, deletedAt: null },
      select: { id: true, reviewId: true, userId: true },
    });
  }

  createResponse(reviewId: number, userId: number, responseText: string) {
    return this.prisma.reviewResponse.create({
      data: { reviewId, userId, responseText },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  updateResponse(responseId: number, responseText: string) {
    return this.prisma.reviewResponse.update({
      where: { id: responseId },
      data: { responseText },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  softDeleteResponse(responseId: number) {
    return this.prisma.reviewResponse.update({
      where: { id: responseId },
      data: { deletedAt: new Date() },
    });
  }
}
