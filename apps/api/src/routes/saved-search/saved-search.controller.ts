import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import type {
  CreateSavedSearchBodyType,
  UpdateSavedSearchBodyType,
} from '@shared/types';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  CreateSavedSearchBodyDto,
  CreateSavedSearchResponseDto,
  GetSavedSearchDetailResponseDto,
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
