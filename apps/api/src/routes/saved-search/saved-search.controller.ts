import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import type { CreateSavedSearchBodyType } from '@shared/types';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  CreateSavedSearchBodyDto,
  CreateSavedSearchResponseDto,
  GetSavedSearchDetailResponseDto,
  GetSavedSearchesResponseDto,
} from './saved-search.dto';
import { SavedSearchService } from './saved-search.service';

@Controller('saved-searches')
export class SavedSearchController {
  constructor(private readonly savedSearchService: SavedSearchService) {}

  @Get()
  @ZodSerializerDto(GetSavedSearchesResponseDto)
  getSavedSearches(@UserActive('userId') userId: number) {
    return this.savedSearchService.getSavedSearches(userId);
  }

  @Get(':id')
  @ZodSerializerDto(GetSavedSearchDetailResponseDto)
  getSavedSearchDetail(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.savedSearchService.getSavedSearchDetail(userId, id);
  }

  @Post()
  @ZodSerializerDto(CreateSavedSearchResponseDto)
  createSavedSearch(
    @UserActive('userId') userId: number,
    @Body() body: CreateSavedSearchBodyDto,
  ) {
    return this.savedSearchService.createSavedSearch(
      userId,
      body as CreateSavedSearchBodyType,
    );
  }
}
