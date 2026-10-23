import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { ExpertConsultationController } from './expert-consultation.controller';
import { ExpertConsultationRepository } from './expert-consultation.repo';
import { ExpertConsultationService } from './expert-consultation.service';

@Module({
  imports: [SharedModule],
  controllers: [ExpertConsultationController],
  providers: [ExpertConsultationService, ExpertConsultationRepository],
})
export class ExpertConsultationModule {}
