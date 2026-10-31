import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { BannersAdminController } from './banners-admin.controller';
import { BannersAdminRepository } from './banners-admin.repo';
import { BannersAdminService } from './banners-admin.service';

@Module({
  imports: [SharedModule],
  controllers: [BannersAdminController],
  providers: [BannersAdminService, BannersAdminRepository],
})
export class BannersAdminModule {}
