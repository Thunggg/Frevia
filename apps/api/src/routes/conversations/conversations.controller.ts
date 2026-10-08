import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import { ConversationService } from './conversations.service';
import {
  CreateConversationBodyDto,
  CreateConversationResponseDto,
  DeleteMessageResponseDto,
  GetConversationsResponseDto,
  GetMessagesResponseDto,
  HideConversationResponseDto,
  PinConversationBodyDto,
  PinConversationResponseDto,
  SendMessageBodyDto,
  SendMessageResponseDto,
  UploadConversationFileResponseDto,
} from './conversations.dto';
import {
  conversationFileFilter,
  conversationFileStorage,
  MAX_CONVERSATION_FILE_SIZE,
} from './conversation-file.storage';
import type {
  CreateConversationBodyType,
  MessageAttachmentType,
  PinConversationBodyType,
  SendMessageBodyType,
} from '@shared/types';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  // Lấy danh sách hội thoại của user hiện tại,
  // mỗi hội thoại kèm tin nhắn cuối (preview) và số tin nhắn chưa đọc
  @Get()
  @ZodSerializerDto(GetConversationsResponseDto)
  getConversations(@UserActive('userId') userId: number) {
    return this.conversationService.getConversations(userId);
  }

  // Tạo mới hội thoại với user khác (hoặc trả về hội thoại đã tồn tại)
  @Post()
  @ZodSerializerDto(CreateConversationResponseDto)
  createConversation(
    @UserActive('userId') userId: number,
    @Body(new ZodValidationPipe(CreateConversationBodyDto))
    body: CreateConversationBodyType,
  ) {
    return this.conversationService.createConversation(
      userId,
      body.participantId,
    );
  }

  // Lấy danh sách tin nhắn của 1 hội thoại
  @Get(':id/messages')
  @ZodSerializerDto(GetMessagesResponseDto)
  getMessages(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.conversationService.getMessages(userId, id);
  }

  // Gửi tin nhắn (REST fallback - realtime chính dùng socket)
  @Post(':id/messages')
  @ZodSerializerDto(SendMessageResponseDto)
  sendMessage(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(SendMessageBodyDto))
    body: SendMessageBodyType,
  ) {
    return this.conversationService.sendMessage(
      userId,
      id,
      body.message,
      body.attachment,
    );
  }

  // Upload file để đính kèm vào tin nhắn (chỉ participant được upload)
  @Post(':id/files')
  @ZodSerializerDto(UploadConversationFileResponseDto)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: conversationFileStorage,
      limits: { fileSize: MAX_CONVERSATION_FILE_SIZE },
      fileFilter: conversationFileFilter,
    }),
  )
  uploadFile(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<MessageAttachmentType> {
    return this.conversationService.uploadFile(userId, id, file);
  }

  // Xóa mềm tin nhắn của bản thân (chỉ sender của tin nhắn mới được xóa)
  @Delete(':id/messages/:messageId')
  @ZodSerializerDto(DeleteMessageResponseDto)
  deleteMessage(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    return this.conversationService.deleteMessage(userId, id, messageId);
  }

  // Đánh dấu tất cả tin nhắn của hội thoại là đã đọc
  @Patch(':id/read')
  markAsRead(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.conversationService.markAsRead(userId, id);
  }

  // Xóa/ẩn hội thoại về phía user hiện tại (soft delete)
  @Patch(':id/hide')
  @ZodSerializerDto(HideConversationResponseDto)
  hideConversation(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.conversationService.hideConversation(userId, id);
  }

  // Ghim/bỏ ghim hội thoại về phía user hiện tại
  @Patch(':id/pin')
  @ZodSerializerDto(PinConversationResponseDto)
  pinConversation(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(PinConversationBodyDto))
    body: PinConversationBodyType,
  ) {
    return this.conversationService.pinConversation(userId, id, body.pinned);
  }
}
