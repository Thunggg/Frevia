import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Query,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import type {
  CreateSavedSearchBodyType,
  GetSavedSearchesQueryType,
  UpdateSavedSearchBodyType,
} from '@shared/types';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  CreateSavedSearchBodyDto,
  CreateSavedSearchResponseDto,
  GetSavedSearchDetailResponseDto,
  GetSavedSearchesQueryDto,
  GetSavedSearchesResponseDto,
  UpdateSavedSearchBodyDto,
  UpdateSavedSearchResponseDto,
} from './saved-search.dto';
import { SavedSearchService } from './saved-search.service';

@Controller('saved-searches')
export class SavedSearchController {
  constructor(private readonly savedSearchService: SavedSearchService) {}

  @Get()
  @ZodSerializerDto(GetSavedSearchesResponseDto)
  getSavedSearches(
    @UserActive('userId') userId: number,
    @Query() query: GetSavedSearchesQueryDto,
  ) {
    return this.savedSearchService.getSavedSearches(
      userId,
      query as GetSavedSearchesQueryType,
    );
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

  @Patch(':id')
  @ZodSerializerDto(UpdateSavedSearchResponseDto)
  updateSavedSearch(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateSavedSearchBodyDto,
  ) {
    return this.savedSearchService.updateSavedSearch(
      userId,
      id,
      body as UpdateSavedSearchBodyType,
    );
  }

  @Delete(':id')
  deleteSavedSearch(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.savedSearchService.deleteSavedSearch(userId, id);
  }
}
