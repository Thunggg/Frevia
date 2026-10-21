import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
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
      profile: { select: { displayName: true, avatarUrl: true } },
    },
  },
  reviewee: {
    select: {
      id: true,
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
      updatedAt: true,
      deletedAt: true,
      user: {
        select: {
          id: true,
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
      select: {
        id: true,
        clientId: true,
        freelancerId: true,
        status: true,
        client: {
          select: { profile: { select: { displayName: true } } },
        },
        freelancer: {
          select: { profile: { select: { displayName: true } } },
        },
      },
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
    reviewerName: string,
    input: CreateReviewType,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const review = await transaction.review.create({
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

      await transaction.notification.create({
        data: {
          userId: revieweeId,
          type: NotificationType.REVIEW_RECEIVED,
          title: 'You received a new review',
          message: `${reviewerName} left you a review for contract #${contractId}.`,
          data: {
            href: `/account-profile?tab=reviews&contractId=${contractId}`,
            contractId,
            reviewId: review.id,
            reviewerId,
          },
        },
      });

      return review;
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

  createResponse(
    reviewId: number,
    userId: number,
    reviewerId: number,
    contractId: number,
    responderName: string,
    responseText: string,
    deletedResponseId?: number,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const include = {
        user: {
          select: {
            id: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      } satisfies Prisma.ReviewResponseInclude;
      const response = deletedResponseId
        ? await transaction.reviewResponse.update({
            where: { id: deletedResponseId },
            data: { userId, responseText, deletedAt: null },
            include,
          })
        : await transaction.reviewResponse.create({
            data: { reviewId, userId, responseText },
            include,
          });

      await transaction.notification.create({
        data: {
          userId: reviewerId,
          type: NotificationType.REVIEW_RESPONSE_RECEIVED,
          title: 'New response to your review',
          message: `${responderName} responded to your review.`,
          data: {
            href: `/account-profile?tab=reviews&contractId=${contractId}`,
            contractId,
            reviewId,
            responseId: response.id,
            responderId: userId,
          },
        },
      });

      return response;
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
