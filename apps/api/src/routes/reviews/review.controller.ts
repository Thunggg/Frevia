import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import type {
  CreateReviewResponseType,
  CreateReviewType,
  UpdateReviewResponseType,
  UpdateReviewType,
} from '@shared/types';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  CreateReviewDto,
  CreateReviewResponseDto,
  ReviewDto,
  ReviewListDto,
  ReviewResponseDto,
  UpdateReviewDto,
  UpdateReviewResponseDto,
} from './review.dto';
import { ReviewService } from './review.service';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  @Get('contracts/:contractId')
  @ZodSerializerDto(ReviewListDto)
  list(
    @UserActive('userId') userId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
  ) {
    return this.service.list(userId, contractId);
  }

  @Post('contracts/:contractId')
  @ZodSerializerDto(ReviewDto)
  create(
    @UserActive('userId') userId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Body() body: CreateReviewDto,
  ) {
    return this.service.create(userId, contractId, body as CreateReviewType);
  }

  @Get(':reviewId')
  @ZodSerializerDto(ReviewDto)
  detail(
    @UserActive('userId') userId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
  ) {
    return this.service.detail(userId, reviewId);
  }

  @Patch(':reviewId')
  @ZodSerializerDto(ReviewDto)
  update(
    @UserActive('userId') userId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() body: UpdateReviewDto,
  ) {
    return this.service.update(userId, reviewId, body as UpdateReviewType);
  }

  @Delete(':reviewId')
  remove(
    @UserActive('userId') userId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
  ) {
    return this.service.remove(userId, reviewId);
  }

  @Post(':reviewId/response')
  @ZodSerializerDto(ReviewResponseDto)
  respond(
    @UserActive('userId') userId: number,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() body: CreateReviewResponseDto,
  ) {
    return this.service.respond(
      userId,
      reviewId,
      (body as CreateReviewResponseType).responseText,
    );
  }

  @Patch('responses/:responseId')
  @ZodSerializerDto(ReviewResponseDto)
  updateResponse(
    @UserActive('userId') userId: number,
    @Param('responseId', ParseIntPipe) responseId: number,
    @Body() body: UpdateReviewResponseDto,
  ) {
    return this.service.updateResponse(
      userId,
      responseId,
      (body as UpdateReviewResponseType).responseText,
    );
  }

  @Delete('responses/:responseId')
  removeResponse(
    @UserActive('userId') userId: number,
    @Param('responseId', ParseIntPipe) responseId: number,
  ) {
    return this.service.removeResponse(userId, responseId);
  }
}
