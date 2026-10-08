import {
  GetConversationsResponseSchema,
  GetMessagesResponseSchema,
  SendMessageBodySchema,
  SendMessageResponseSchema,
  CreateConversationBodySchema,
  CreateConversationResponseSchema,
  HideConversationResponseSchema,
  PinConversationBodySchema,
  PinConversationResponseSchema,
  DeleteMessageResponseSchema,
  UploadConversationFileResponseSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class GetConversationsResponseDto extends createZodDto(
  GetConversationsResponseSchema,
) {}

export class CreateConversationBodyDto extends createZodDto(
  CreateConversationBodySchema,
) {}

export class CreateConversationResponseDto extends createZodDto(
  CreateConversationResponseSchema,
) {}

export class GetMessagesResponseDto extends createZodDto(
  GetMessagesResponseSchema,
) {}

export class SendMessageBodyDto extends createZodDto(SendMessageBodySchema) {}

export class SendMessageResponseDto extends createZodDto(
  SendMessageResponseSchema,
) {}

export class HideConversationResponseDto extends createZodDto(
  HideConversationResponseSchema,
) {}

export class PinConversationBodyDto extends createZodDto(
  PinConversationBodySchema,
) {}

export class PinConversationResponseDto extends createZodDto(
  PinConversationResponseSchema,
) {}

export class DeleteMessageResponseDto extends createZodDto(
  DeleteMessageResponseSchema,
) {}

export class UploadConversationFileResponseDto extends createZodDto(
  UploadConversationFileResponseSchema,
) {}
