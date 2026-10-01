import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { UserActive } from '../../../shared/decorators/user-active.decorators';
import { ForumReportService } from './forums-reports.service';
import {
  CreateForumReportDto,
  CreateForumReportResponseDto,
  UpdateReportStatusDto,
  UpdateReportStatusResponseDto,
  ForumReportListResponseDto,
} from './forums-reports.dto';

@Controller('forums')
export class ForumReportController {
  constructor(private readonly forumReportService: ForumReportService) {}

  @Post('posts/:postId/reports')
  @ZodSerializerDto(CreateForumReportResponseDto)
  createPostReport(
    @UserActive('userId') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Body(new ZodValidationPipe(CreateForumReportDto))
    body: CreateForumReportDto,
  ) {
    return this.forumReportService.createPostReport(
      userId,
      postId,
      body.reason,
    );
  }

  @Post('posts/:postId/comments/:commentId/reports')
  @ZodSerializerDto(CreateForumReportResponseDto)
  createCommentReport(
    @UserActive('userId') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body(new ZodValidationPipe(CreateForumReportDto))
    body: CreateForumReportDto,
  ) {
    return this.forumReportService.createCommentReport(
      userId,
      postId,
      commentId,
      body.reason,
    );
  }

  @Get('posts/:postId/is-reported')
  async checkPostReported(
    @UserActive('userId') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    const report = await this.forumReportService.checkReportedByUser(
      userId,
      postId,
      null,
    );
    return { reported: !!report };
  }

  @Get('posts/:postId/comments/:commentId/is-reported')
  async checkCommentReported(
    @UserActive('userId') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    const report = await this.forumReportService.checkReportedByUser(
      userId,
      postId,
      commentId,
    );
    return { reported: !!report };
  }

  @Get('reports')
  @ZodSerializerDto(ForumReportListResponseDto)
  getForumReportLists(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('status') status: string,
    @Query('search') search: string,
  ) {
    return this.forumReportService.getForumReportLists(
      roleName,
      Number(page) || 1,
      Number(limit) || 10,
      status || undefined,
      search || undefined,
    );
  }

  @Patch('reports/:reportId/status')
  @ZodSerializerDto(UpdateReportStatusResponseDto)
  updateReportStatus(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('reportId', ParseIntPipe) reportId: number,
    @Body(new ZodValidationPipe(UpdateReportStatusDto))
    body: UpdateReportStatusDto,
  ) {
    return this.forumReportService.updateReportStatus(
      reportId,
      body.status,
      userId,
      roleName,
    );
  }
}
