import { Module } from '@nestjs/common';
import { SharedFileController } from './shared-file.controller';
import { SharedFileRepository } from './shared-file.repo';
import { SharedFileService } from './shared-file.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
    imports: [SharedModule],
    controllers: [SharedFileController],
    providers: [SharedFileService, SharedFileRepository],
})
export class SharedFileModule { }
