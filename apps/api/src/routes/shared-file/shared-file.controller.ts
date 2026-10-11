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
  DeleteSharedFileResponseDTO,
  GetSharedFilesResponseDTO,
  UploadSharedFileResponseDTO,
} from './shared-file.dto';
import { SharedFileService } from './shared-file.service';

@Controller('contracts/:contractId/files')
export class SharedFileController {
  constructor(private readonly sharedFileService: SharedFileService) {}

  @Get()
  @ZodSerializerDto(GetSharedFilesResponseDTO)
  async getSharedFiles(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('contractId', ParseIntPipe) contractId: number,
  ) {
    return this.sharedFileService.getSharedFiles(userId, roleName, contractId);
  }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    @ZodSerializerDto(UploadSharedFileResponseDTO)
    async uploadSharedFile(
        @UserActive('userId') userId: number,
        @UserActive('roleName') roleName: string,
        @Param('contractId', ParseIntPipe) contractId: number,
        @UploadedFile(buildUploadFilePipe()) file: Express.Multer.File,
    ) {
        return this.sharedFileService.uploadSharedFile(
            userId,
            roleName,
            contractId,
            file,
        );
    }

  @Delete(':fileId')
  @ZodSerializerDto(DeleteSharedFileResponseDTO)
  async deleteSharedFile(
    @UserActive('userId') userId: number,
    @UserActive('roleName') roleName: string,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Param('fileId', ParseIntPipe) fileId: number,
  ) {
    return this.sharedFileService.deleteSharedFile(
      userId,
      roleName,
      contractId,
      fileId,
    );
  }
}
