import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ManageConversationMessage } from '@shared/types';

export const ConversationNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageConversationMessage.CONVERSATION_NOT_FOUND,
      path: 'conversationId',
    },
  ]);

export const ConversationAccessDeniedException = () =>
  new ForbiddenException([
    {
      message: ManageConversationMessage.CONVERSATION_ACCESS_DENIED,
      path: 'conversationId',
    },
  ]);

export const MessageNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageConversationMessage.MESSAGE_NOT_FOUND,
      path: 'messageId',
    },
  ]);

export const MessageAccessDeniedException = () =>
  new ForbiddenException([
    {
      message: ManageConversationMessage.MESSAGE_ACCESS_DENIED,
      path: 'messageId',
    },
  ]);

export const CannotStartConversationWithSelfException = () =>
  new BadRequestException([
    {
      message: ManageConversationMessage.CONVERSATION_ACCESS_DENIED,
      path: 'participantId',
    },
  ]);

export const FailedToLoadConversationsException = () =>
  new InternalServerErrorException([
    {
      message: ManageConversationMessage.FAILED_TO_LOAD_CONVERSATIONS,
      path: 'conversations',
    },
  ]);

export const FailedToCreateConversationException = () =>
  new InternalServerErrorException([
    {
      message: ManageConversationMessage.FAILED_TO_CREATE_CONVERSATION,
      path: 'createConversation',
    },
  ]);

export const FailedToSendMessageException = () =>
  new InternalServerErrorException([
    {
      message: ManageConversationMessage.FAILED_TO_SEND_MESSAGE,
      path: 'sendMessage',
    },
  ]);

export const FailedToMarkAsReadException = () =>
  new InternalServerErrorException([
    {
      message: ManageConversationMessage.FAILED_TO_MARK_AS_READ,
      path: 'markAsRead',
    },
  ]);

export const FailedToHideConversationException = () =>
  new InternalServerErrorException([
    {
      message: ManageConversationMessage.FAILED_TO_HIDE_CONVERSATION,
      path: 'hideConversation',
    },
  ]);

export const FailedToPinConversationException = () =>
  new InternalServerErrorException([
    {
      message: ManageConversationMessage.FAILED_TO_PIN_CONVERSATION,
      path: 'pinConversation',
    },
  ]);

export const FailedToDeleteMessageException = () =>
  new InternalServerErrorException([
    {
      message: ManageConversationMessage.FAILED_TO_DELETE_MESSAGE,
      path: 'deleteMessage',
    },
  ]);

export const FailedToUploadFileException = () =>
  new InternalServerErrorException([
    {
      message: ManageConversationMessage.FAILED_TO_UPLOAD_FILE,
      path: 'file',
    },
  ]);

export const FileTooLargeException = () =>
  new PayloadTooLargeException([
    {
      message: ManageConversationMessage.FILE_TOO_LARGE,
      path: 'file',
    },
  ]);

export const FileTypeNotAllowedException = () =>
  new BadRequestException([
    {
      message: ManageConversationMessage.FILE_TYPE_NOT_ALLOWED,
      path: 'file',
    },
  ]);
