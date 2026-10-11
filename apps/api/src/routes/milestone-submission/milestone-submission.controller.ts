import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import type { RequestChangesBodyType, SubmitMilestoneBodyType } from '@shared/types';
import {
    ApproveMilestoneResponseDTO,
    GetSubmissionsResponseDTO,
    GetSubmissionResponseDTO,
    RequestChangesBodyDTO,
    RequestChangesResponseDTO,
    SubmitMilestoneBodyDTO,
    SubmitMilestoneResponseDTO,
} from './milestone-submission.dto';
import { MilestoneSubmissionService } from './milestone-submission.service';

@Controller('contracts/:contractId/milestones/:milestoneId/submissions')
export class MilestoneSubmissionController {
    constructor(private readonly submissionService: MilestoneSubmissionService) { }

    @Post()
    @ZodSerializerDto(SubmitMilestoneResponseDTO)
    submitMilestone(
        @UserActive('userId') userId: number,
        @UserActive('roleName') roleName: string,
        @Param('contractId', ParseIntPipe) contractId: number,
        @Param('milestoneId', ParseIntPipe) milestoneId: number,
        @Body() body: SubmitMilestoneBodyDTO,
    ) {
        return this.submissionService.submitMilestone(
            userId, roleName, contractId, milestoneId, body as SubmitMilestoneBodyType,
        );
    }

    @Get()
    @ZodSerializerDto(GetSubmissionsResponseDTO)
    getSubmissions(
        @UserActive('userId') userId: number,
        @UserActive('roleName') roleName: string,
        @Param('contractId', ParseIntPipe) contractId: number,
        @Param('milestoneId', ParseIntPipe) milestoneId: number,
    ) {
        return this.submissionService.getSubmission(
            userId, roleName, contractId, milestoneId,
        );
    }

    @Get(':id')
    @ZodSerializerDto(GetSubmissionResponseDTO)
    getSubmissionDetail(
        @UserActive('userId') userId: number,
        @UserActive('roleName') roleName: string,
        @Param('contractId', ParseIntPipe) contractId: number,
        @Param('milestoneId', ParseIntPipe) milestoneId: number,
        @Param('id', ParseIntPipe) submissionId: number,
    ) {
        return this.submissionService.getSubmissionDetail(
            userId, roleName, contractId, milestoneId, submissionId,
        );
    }

    @Patch(':id/request-changes')
    @ZodSerializerDto(RequestChangesResponseDTO)
    requestChanges(
        @UserActive('userId') userId: number,
        @UserActive('roleName') roleName: string,
        @Param('contractId', ParseIntPipe) contractId: number,
        @Param('milestoneId', ParseIntPipe) milestoneId: number,
        @Param('id', ParseIntPipe) submissionId: number,
        @Body() body: RequestChangesBodyDTO,
    ) {
        return this.submissionService.requestChanges(
            userId, roleName, contractId, milestoneId, submissionId, body as RequestChangesBodyType,
        );
    }

    @Patch(':id/approve')
    @ZodSerializerDto(ApproveMilestoneResponseDTO)
    approveMilestone(
        @UserActive('userId') userId: number,
        @UserActive('roleName') roleName: string,
        @Param('contractId', ParseIntPipe) contractId: number,
        @Param('milestoneId', ParseIntPipe) milestoneId: number,
        @Param('id', ParseIntPipe) submissionId: number,
    ) {
        return this.submissionService.approveMilestone(
            userId, roleName, contractId, milestoneId, submissionId,
        );
    }
}
