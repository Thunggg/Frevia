import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CreateReviewType, UpdateReviewType } from '@shared/types';
import {
  ReviewAlreadyExistsException,
  ReviewContractNotFoundException,
  ReviewForbiddenException,
  ReviewNotFoundException,
  ReviewResponseAlreadyExistsException,
  ReviewResponseNotFoundException,
} from './review.error';
import { ReviewRepository } from './review.repo';

@Injectable()
export class ReviewService {
  constructor(private readonly repository: ReviewRepository) {}

  private async requireContractParticipant(userId: number, contractId: number) {
    const contract = await this.repository.findContract(contractId);
    if (!contract) throw ReviewContractNotFoundException();
    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      throw ReviewForbiddenException();
    }
    return contract;
  }

  private present<
    T extends {
      overallRating: Prisma.Decimal;
      response?: { deletedAt: Date | null } | null;
    },
  >(review: T) {
    return {
      ...review,
      overallRating: Number(review.overallRating),
      ...(review.response?.deletedAt ? { response: null } : {}),
    };
  }

  async list(userId: number, contractId: number) {
    await this.requireContractParticipant(userId, contractId);
    const reviews = await this.repository.findManyByContract(contractId);
    return reviews.map((review) => this.present(review));
  }

  async detail(userId: number, reviewId: number) {
    const review = await this.repository.findById(reviewId);
    if (!review) throw ReviewNotFoundException();
    await this.requireContractParticipant(userId, review.contractId);
    return this.present(review);
  }

  async create(userId: number, contractId: number, input: CreateReviewType) {
    const contract = await this.requireContractParticipant(userId, contractId);
    if (await this.repository.findByContractAndReviewer(contractId, userId)) {
      throw ReviewAlreadyExistsException();
    }
    const revieweeId =
      contract.clientId === userId ? contract.freelancerId : contract.clientId;
    try {
      return this.present(
        await this.repository.create(contractId, userId, revieweeId, input),
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw ReviewAlreadyExistsException();
      }
      throw error;
    }
  }

  async update(userId: number, reviewId: number, input: UpdateReviewType) {
    const review = await this.repository.findById(reviewId);
    if (!review) throw ReviewNotFoundException();
    if (review.reviewerId !== userId) throw ReviewForbiddenException();
    return this.present(await this.repository.update(reviewId, input));
  }

  async remove(userId: number, reviewId: number) {
    const review = await this.repository.findById(reviewId);
    if (!review) throw ReviewNotFoundException();
    if (review.reviewerId !== userId) throw ReviewForbiddenException();
    await this.repository.softDelete(reviewId);
    return { message: 'Review deleted successfully.' };
  }

  async respond(userId: number, reviewId: number, responseText: string) {
    const review = await this.repository.findById(reviewId);
    if (!review) throw ReviewNotFoundException();
    if (review.revieweeId !== userId) throw ReviewForbiddenException();
    if (await this.repository.findResponseByReview(reviewId)) {
      throw ReviewResponseAlreadyExistsException();
    }
    try {
      return await this.repository.createResponse(
        reviewId,
        userId,
        responseText,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw ReviewResponseAlreadyExistsException();
      }
      if (error instanceof HttpException) throw error;
      throw error;
    }
  }

  async updateResponse(
    userId: number,
    responseId: number,
    responseText: string,
  ) {
    const response = await this.repository.findResponseById(responseId);
    if (!response) throw ReviewResponseNotFoundException();
    if (response.userId !== userId) throw ReviewForbiddenException();
    return this.repository.updateResponse(responseId, responseText);
  }

  async removeResponse(userId: number, responseId: number) {
    const response = await this.repository.findResponseById(responseId);
    if (!response) throw ReviewResponseNotFoundException();
    if (response.userId !== userId) throw ReviewForbiddenException();
    await this.repository.softDeleteResponse(responseId);
    return { message: 'Review response deleted successfully.' };
  }
}
