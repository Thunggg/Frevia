import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { SavedSearchController } from './saved-search.controller';
import { SavedSearchRepository } from './saved-search.repo';
import { SavedSearchService } from './saved-search.service';

@Module({
  imports: [SharedModule],
  controllers: [SavedSearchController],
  providers: [SavedSearchRepository, SavedSearchService],
})
export class SavedSearchModule {}
