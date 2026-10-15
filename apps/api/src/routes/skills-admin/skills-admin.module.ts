import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { SkillsAdminController } from './skills-admin.controller';
import { SkillsAdminRepository } from './skills-admin.repo';
import { SkillsAdminService } from './skills-admin.service';

@Module({
  imports: [SharedModule],
  controllers: [SkillsAdminController],
  providers: [SkillsAdminService, SkillsAdminRepository],
})
export class SkillsAdminModule {}
