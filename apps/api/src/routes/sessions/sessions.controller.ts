import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  RevokeSessionResponseDto,
  SessionDetailResponseDto,
  SessionFilterDto,
  SessionListResponseDto,
} from './sessions.dto';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ZodSerializerDto(SessionListResponseDto)
  getMySessions(
    @UserActive('userId') userId: number,
    @UserActive('sessionId') sessionId: number,
    @Query() query: SessionFilterDto,
  ) {
    return this.sessionsService.getMySessions(userId, query, sessionId);
  }

  @Get(':id')
  @ZodSerializerDto(SessionDetailResponseDto)
  getMySessionById(
    @UserActive('userId') userId: number,
    @UserActive('sessionId') sessionId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sessionsService.getMySessionById(id, userId, sessionId);
  }

  @Delete(':id')
  @ZodSerializerDto(RevokeSessionResponseDto)
  revokeMySession(
    @UserActive('userId') userId: number,
    @UserActive('sessionId') sessionId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sessionsService.revokeMySession(id, userId, sessionId);
  }
}
