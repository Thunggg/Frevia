import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { RoleName } from '@shared/types';

import { UserActive } from '../../shared/decorators/user-active.decorators';
import { EmbeddingOutboxService } from './embedding-outbox.service';
import {
  RecommendationExplanationDto,
  RecommendationFeedbackBodyDto,
  RecommendationFeedbackResponseDto,
  RecommendationOutboxProcessResponseDto,
  RecommendationReindexResponseDto,
  RecommendedFreelancerResponseDto,
  RecommendedJobResponseDto,
  ViewRecommendedFreelancersQueryDto,
  ViewRecommendedJobsQueryDto,
} from './recommendation.dto';
import { RecommendationIndexService } from './recommendation-index.service';
import {
  FailedToProcessOutboxException,
  FailedToReindexException,
  RecommendationOutboxForbiddenException,
  RecommendationReindexForbiddenException,
} from './recommendation.error';
import { RecommendationService } from './recommendation.service';

@Controller('recommendations')
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
    private readonly recommendationIndexService: RecommendationIndexService,
    private readonly embeddingOutboxService: EmbeddingOutboxService,
  ) {}

  @Get('jobs')
  @ZodSerializerDto(RecommendedJobResponseDto)
  getRecommendedJobs(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Query() query: ViewRecommendedJobsQueryDto,
  ) {
    return this.recommendationService.getRecommendedJobs(
      userId,
      roleName,
      query,
    );
  }

  @Get('freelancers')
  @ZodSerializerDto(RecommendedFreelancerResponseDto)
  getRecommendedFreelancers(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Query() query: ViewRecommendedFreelancersQueryDto,
  ) {
    return this.recommendationService.getRecommendedFreelancers(
      userId,
      roleName,
      query,
    );
  }

  @Get(':id/explanation')
  @ZodSerializerDto(RecommendationExplanationDto)
  getExplanation(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.recommendationService.getExplanation(userId, id);
  }

  @Post(':id/feedback')
  @ZodSerializerDto(RecommendationFeedbackResponseDto)
  submitFeedback(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RecommendationFeedbackBodyDto,
  ) {
    return this.recommendationService.submitFeedback(userId, id, body.type);
  }

  @Post('reindex')
  @ZodSerializerDto(RecommendationReindexResponseDto)
  async reindex(@UserActive('roleName') roleName: string) {
    if (roleName !== RoleName.ADMIN) {
      throw RecommendationReindexForbiddenException();
    }

    try {
      return await this.recommendationIndexService.rebuild();
    } catch {
      throw FailedToReindexException();
    }
  }

  @Post('outbox/process')
  @ZodSerializerDto(RecommendationOutboxProcessResponseDto)
  async processOutbox(@UserActive('roleName') roleName: string) {
    if (roleName !== RoleName.ADMIN) {
      throw RecommendationOutboxForbiddenException();
    }

    try {
      return await this.embeddingOutboxService.processPending();
    } catch {
      throw FailedToProcessOutboxException();
    }
  }
}
