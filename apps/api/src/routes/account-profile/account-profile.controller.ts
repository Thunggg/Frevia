import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZodSerializerDto } from 'nestjs-zod';
import { IsPublic } from '../../shared/decorators/auth.decorator';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import {
  AddSocialLinkDto,
  ClientProfileDetailDto,
  FavoriteFreelancerListDto,
  IdentityVerificationDocumentDto,
  IdentityVerificationStatusDto,
  SocialLinkDto,
  SocialLinkListDto,
  UpdateClientProfileDto,
  UploadIdentityDocumentDto,
} from './account-profile.dto';
import { AccountProfileService } from './account-profile.service';
import { createReadStream } from 'fs';
import type { Response } from 'express';

@Controller('identity-verifications')
export class IdentityVerificationController {
  constructor(private readonly service: AccountProfileService) {}

  @Post('documents')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @ZodSerializerDto(IdentityVerificationDocumentDto)
  upload(
    @UserActive('userId') userId: number,
    @Body() body: UploadIdentityDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.uploadIdentityDocument(userId, body.documentType, file);
  }

  @Get('status')
  @ZodSerializerDto(IdentityVerificationStatusDto)
  getStatus(@UserActive('userId') userId: number) {
    return this.service.getIdentityStatus(userId);
  }

  @Get('documents/:id/file')
  async getFile(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.service.getIdentityDocumentFile(userId, id);
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${file.fileName.replace(/"/g, '')}"`,
    );
    response.setHeader('Content-Type', 'application/octet-stream');
    return new StreamableFile(createReadStream(file.absolutePath));
  }
}

@Controller('clients')
export class ClientProfileController {
  constructor(private readonly service: AccountProfileService) {}

  @Get(':userId')
  @IsPublic()
  @ZodSerializerDto(ClientProfileDetailDto)
  getDetail(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.getClientProfile(userId);
  }

  @Put('me/profile')
  @ZodSerializerDto(ClientProfileDetailDto)
  update(
    @UserActive('userId') userId: number,
    @Body() body: UpdateClientProfileDto,
  ) {
    return this.service.updateClientProfile(userId, body);
  }
}

@Controller('social-links')
export class SocialLinkController {
  constructor(private readonly service: AccountProfileService) {}

  @Get()
  @ZodSerializerDto(SocialLinkListDto)
  getAll(@UserActive('userId') userId: number) {
    return this.service.getSocialLinks(userId);
  }

  @Post()
  @ZodSerializerDto(SocialLinkDto)
  add(@UserActive('userId') userId: number, @Body() body: AddSocialLinkDto) {
    return this.service.addSocialLink(userId, body);
  }

  @Delete(':id')
  remove(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteSocialLink(userId, id);
  }
}

@Controller('favorites/freelancers')
export class FavoriteFreelancerController {
  constructor(private readonly service: AccountProfileService) {}

  @Get()
  @ZodSerializerDto(FavoriteFreelancerListDto)
  getAll(@UserActive('userId') userId: number) {
    return this.service.getFavorites(userId);
  }

  @Post(':freelancerId')
  add(
    @UserActive('userId') userId: number,
    @Param('freelancerId', ParseIntPipe) freelancerId: number,
  ) {
    return this.service.addFavorite(userId, freelancerId);
  }

  @Delete(':freelancerId')
  remove(
    @UserActive('userId') userId: number,
    @Param('freelancerId', ParseIntPipe) freelancerId: number,
  ) {
    return this.service.removeFavorite(userId, freelancerId);
  }
}
