import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { BannersController } from './banners.controller';
import { BannersRepository } from './banners.repo';
import { BannersService } from './banners.service';

@Module({
  imports: [SharedModule],
  controllers: [BannersController],
  providers: [BannersService, BannersRepository],
})
export class BannersModule {}
