import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import { buildUploadFilePipe } from '../../shared/config/file-upload.config';
import {
  DeleteMilestoneFileResponseDTO,
  GetMilestoneFilesResponseDTO,
  UploadMilestoneFileResponseDTO,
} from './milestone-file.dto';
import { MilestoneFileService } from './milestone-file.service';

@Controller('contracts/:contractId/milestones/:milestoneId/files')
export class MilestoneFileController {
  constructor(private readonly milestoneFileService: MilestoneFileService) {}

  @Get()
  @ZodSerializerDto(GetMilestoneFilesResponseDTO)
  getMilestoneFiles(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
  ) {
    return this.milestoneFileService.getMilestoneFiles(
      userId,
      roleName,
      contractId,
      milestoneId,
    );
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ZodSerializerDto(UploadMilestoneFileResponseDTO)
  uploadMilestoneFile(
    @UserActive('userId') userId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
    @UploadedFile(buildUploadFilePipe()) file: Express.Multer.File,
  ) {
    return this.milestoneFileService.uploadMilestoneFile(
      userId,
      contractId,
      milestoneId,
      file,
    );
  }

  @Delete(':fileId')
  @ZodSerializerDto(DeleteMilestoneFileResponseDTO)
  deleteMilestoneFile(
    @UserActive('userId') userId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
    @Param('fileId', ParseIntPipe) fileId: number,
  ) {
    return this.milestoneFileService.deleteMilestoneFile(
      userId,
      contractId,
      milestoneId,
      fileId,
    );
  }
}
