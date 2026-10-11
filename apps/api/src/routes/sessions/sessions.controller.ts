import { Controller, Get, Query } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import { SessionFilterDto, SessionListResponseDto } from './sessions.dto';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ZodSerializerDto(SessionListResponseDto)
  getMySessions(
    @UserActive('userId') userId: number,
    @Query() query: SessionFilterDto,
  ) {
    return this.sessionsService.getMySessions(userId, query);
  }
}
