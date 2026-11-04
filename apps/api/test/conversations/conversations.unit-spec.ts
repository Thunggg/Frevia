import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import {
  CreateConversationBodySchema,
  SendMessageBodySchema,
} from '@shared/types';
import { ConversationRepository } from '../../src/routes/conversations/conversations.repo';
import { ConversationService } from '../../src/routes/conversations/conversations.service';
import { FileTooLargeException } from '../../src/routes/conversations/conversations.error';
import {
  MAX_CONVERSATION_FILE_SIZE,
  conversationFileFilter,
  isAllowedFileType,
  uploadConversationFile,
} from '../../src/routes/conversations/conversation-file.storage';

jest.mock('../../src/routes/conversations/conversation-file.storage', () => {
  const actual = jest.requireActual(
    '../../src/routes/conversations/conversation-file.storage',
  );

  return {
    ...actual,
    uploadConversationFile: jest.fn(),
  };
});

const mockedUploadConversationFile =
  uploadConversationFile as jest.MockedFunction<typeof uploadConversationFile>;

describe('Conversations (UF-18 to UF-25)', () => {
  const repository = {
    getConversationsByUserId: jest.fn(),
    findConversationByIdForUser: jest.fn(),
    findConversationBetween: jest.fn(),
    getMessages: jest.fn(),
    createConversation: jest.fn(),
    createMessage: jest.fn(),
    unhideConversation: jest.fn(),
    softDeleteMessage: jest.fn(),
    markMessagesAsRead: jest.fn(),
    hideConversationForUser: jest.fn(),
    setPinnedForUser: jest.fn(),
  };

  const service = new ConversationService(
    repository as unknown as ConversationRepository,
  );

  const createdAt = new Date('2026-01-01T00:00:00.000Z');

  const directMessage = (
    overrides: Partial<Record<string, unknown>> = {},
  ): Record<string, unknown> => ({
    id: 1,
    conversationId: 1,
    senderId: 20,
    message: 'Hello',
    fileUrl: null,
    fileName: null,
    fileSize: null,
    fileType: null,
    isRead: false,
    createdAt,
    deletedAt: null,
    ...overrides,
  });

  const conversation = (
    overrides: Partial<Record<string, unknown>> = {},
  ): Record<string, unknown> => ({
    id: 1,
    participant1: 10,
    participant2: 20,
    createdAt,
    participant1PinnedAt: null,
    participant2PinnedAt: null,
    participantOne: {
      id: 10,
      profile: { displayName: 'Me', avatarUrl: null },
    },
    participantTwo: {
      id: 20,
      profile: { displayName: 'Other', avatarUrl: null },
    },
    messages: [],
    _count: { messages: 0 },
    ...overrides,
  });

  const multerFile = (
    overrides: Partial<Record<string, unknown>> = {},
  ): Express.Multer.File =>
    ({
      fieldname: 'file',
      originalname: 'document.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 1024 * 1024,
      buffer: Buffer.from('file-content'),
      destination: '',
      filename: '',
      path: '',
      stream: null,
      ...overrides,
    }) as unknown as Express.Multer.File;

  beforeEach(() => {
    jest.clearAllMocks();
    repository.unhideConversation.mockResolvedValue(undefined);
  });

  describe('UF-18 getConversations', () => {
    // UF-18: Trả về hội thoại ghim trước, kèm unreadCount và thông tin người còn lại.
    it('returns conversations with pinned items first, then the latest message', async () => {
      const pinned = conversation({
        id: 1,
        participant1PinnedAt: new Date('2026-01-01T00:00:00.000Z'),
        messages: [
          directMessage({
            id: 11,
            createdAt: new Date('2026-01-02T00:00:00.000Z'),
          }),
        ],
        _count: { messages: 2 },
      });
      const recent = conversation({
        id: 2,
        messages: [
          directMessage({
            id: 22,
            createdAt: new Date('2026-01-05T00:00:00.000Z'),
          }),
        ],
      });

      repository.getConversationsByUserId.mockResolvedValue([recent, pinned]);

      const result = await service.getConversations(10);

      expect(result.map((item) => item.id)).toEqual([1, 2]);
      expect(result[0].pinnedAt).toEqual(
        new Date('2026-01-01T00:00:00.000Z'),
      );
      expect(result[0].unreadCount).toBe(2);
      expect(result[0].otherUser.id).toBe(20);
    });

    // Hội thoại không ghim được sắp xếp theo tin nhắn mới nhất.
    it('sorts unpinned conversations by the most recent message', async () => {
      const older = conversation({
        id: 3,
        messages: [
          directMessage({
            createdAt: new Date('2026-01-02T00:00:00.000Z'),
          }),
        ],
      });
      const newer = conversation({
        id: 4,
        messages: [
          directMessage({
            createdAt: new Date('2026-01-04T00:00:00.000Z'),
          }),
        ],
      });

      repository.getConversationsByUserId.mockResolvedValue([older, newer]);

      const result = await service.getConversations(10);

      expect(result.map((item) => item.id)).toEqual([4, 3]);
    });

    // Nhiều hội thoại ghim được sắp xếp theo thời điểm ghim giảm dần.
    it('sorts pinned conversations by pin time descending', async () => {
      const olderPin = conversation({
        id: 5,
        participant1PinnedAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      const newerPin = conversation({
        id: 6,
        participant1PinnedAt: new Date('2026-01-03T00:00:00.000Z'),
      });

      repository.getConversationsByUserId.mockResolvedValue([
        olderPin,
        newerPin,
      ]);

      const result = await service.getConversations(10);

      expect(result.map((item) => item.id)).toEqual([6, 5]);
    });

    // Người dùng chưa có hội thoại nhận mảng rỗng.
    it('returns an empty list for a user without conversations', async () => {
      repository.getConversationsByUserId.mockResolvedValue([]);

      await expect(service.getConversations(10)).resolves.toEqual([]);
    });

    // Biên: người dùng không có dữ liệu vẫn nhận mảng rỗng thay vì lỗi.
    it('returns an empty list for a user with no conversations (duplicate boundary)', async () => {
      repository.getConversationsByUserId.mockResolvedValue([]);

      await expect(service.getConversations(999)).resolves.toEqual([]);
    });

    // Lỗi database được bọc thành FailedToLoadConversationsException.
    it('wraps a database error in FailedToLoadConversationsException', async () => {
      repository.getConversationsByUserId.mockRejectedValue(
        new Error('database is down'),
      );

      await expect(service.getConversations(10)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-19 createConversation', () => {
    // UF-19: Tạo hội thoại mới khi hai người chưa từng nhắn tin.
    it('creates a new conversation when the pair has no history', async () => {
      const created = {
        id: 1,
        participant1: 10,
        participant2: 20,
        createdAt,
      };
      repository.findConversationBetween.mockResolvedValue(null);
      repository.createConversation.mockResolvedValue(created);

      await expect(service.createConversation(10, 20)).resolves.toEqual(
        created,
      );
      expect(repository.createConversation).toHaveBeenCalledWith(10, 20);
    });

    // Nếu đã có hội thoại thì trả về hội thoại cũ và mở lại (unhide), không tạo mới.
    it('returns and reopens an existing conversation', async () => {
      const existing = {
        id: 7,
        participant1: 20,
        participant2: 10,
        createdAt,
      };
      repository.findConversationBetween.mockResolvedValue(existing);

      await expect(service.createConversation(10, 20)).resolves.toEqual({
        id: 7,
        participant1: 20,
        participant2: 10,
        createdAt,
      });
      expect(repository.unhideConversation).toHaveBeenCalledWith(7);
      expect(repository.createConversation).not.toHaveBeenCalled();
    });

    // Không cho phép tự tạo hội thoại với chính mình.
    it('rejects a self-conversation', async () => {
      await expect(service.createConversation(10, 10)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.findConversationBetween).not.toHaveBeenCalled();
    });

    // Schema từ chối participantId = 0.
    it('rejects participant id 0 through CreateConversationBodySchema', () => {
      const parsed = CreateConversationBodySchema.safeParse({
        participantId: 0,
      });

      expect(parsed.success).toBe(false);
    });

    // Tạo hội thoại mới cho một cặp người dùng khác.
    it('creates a new conversation for a different pair', async () => {
      repository.findConversationBetween.mockResolvedValue(null);
      repository.createConversation.mockResolvedValue({
        id: 9,
        participant1: 10,
        participant2: 30,
        createdAt,
      });

      const result = await service.createConversation(10, 30);

      expect(result.id).toBe(9);
    });
  });

  describe('UF-20 getMessages', () => {
    // UF-20: Trả về lịch sử tin nhắn cho người tham gia hội thoại.
    it('returns the message history for a participant', async () => {
      const messages = [directMessage({ id: 1 }), directMessage({ id: 2 })];
      repository.findConversationByIdForUser.mockResolvedValue(
        conversation(),
      );
      repository.getMessages.mockResolvedValue(messages);

      await expect(service.getMessages(10, 1)).resolves.toEqual(messages);
      expect(repository.getMessages).toHaveBeenCalledWith(1);
    });

    // Hội thoại chưa có tin nhắn trả về mảng rỗng.
    it('returns an empty history when the conversation has no messages', async () => {
      repository.findConversationByIdForUser.mockResolvedValue(
        conversation(),
      );
      repository.getMessages.mockResolvedValue([]);

      await expect(service.getMessages(10, 1)).resolves.toEqual([]);
    });

    // Người không tham gia hội thoại nhận NotFound và không đọc tin nhắn.
    it('raises NotFound for a non-participant', async () => {
      repository.findConversationByIdForUser.mockResolvedValue(null);

      await expect(service.getMessages(99, 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.getMessages).not.toHaveBeenCalled();
    });

    // Hội thoại không tồn tại trả về NotFound.
    it('raises NotFound for a missing conversation', async () => {
      repository.findConversationByIdForUser.mockResolvedValue(null);

      await expect(service.getMessages(10, 999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('UF-21 sendMessage', () => {
    // UF-21: Lưu tin nhắn văn bản hợp lệ và mở lại hội thoại cho cả hai bên.
    it('saves a valid text message and reopens both sides', async () => {
      const saved = directMessage({ id: 30, message: 'Hello there' });
      repository.findConversationByIdForUser.mockResolvedValue(
        conversation(),
      );
      repository.createMessage.mockResolvedValue(saved);

      await expect(
        service.sendMessage(10, 1, 'Hello there'),
      ).resolves.toEqual(saved);
      expect(repository.createMessage).toHaveBeenCalledWith(
        1,
        10,
        'Hello there',
        undefined,
      );
      expect(repository.unhideConversation).toHaveBeenCalledWith(1);
    });

    // Chấp nhận tin nhắn đúng 2000 ký tự (biên trên).
    it('accepts a message of exactly 2000 characters', async () => {
      const message = 'a'.repeat(2000);
      const parsed = SendMessageBodySchema.safeParse({ message });

      expect(parsed.success).toBe(true);

      repository.findConversationByIdForUser.mockResolvedValue(
        conversation(),
      );
      repository.createMessage.mockResolvedValue(directMessage({ message }));

      const result = await service.sendMessage(10, 1, message);

      expect(result.message).toHaveLength(2000);
    });

    // Từ chối tin nhắn rỗng khi không có tệp đính kèm.
    it('rejects an empty message without an attachment', () => {
      const parsed = SendMessageBodySchema.safeParse({ message: '' });

      expect(parsed.success).toBe(false);
    });

    // Từ chối tin nhắn 2001 ký tự (vượt biên).
    it('rejects a message of 2001 characters', () => {
      const parsed = SendMessageBodySchema.safeParse({
        message: 'a'.repeat(2001),
      });

      expect(parsed.success).toBe(false);
    });

    // Chấp nhận nội dung rỗng khi có tệp đính kèm.
    it('accepts an empty message when an attachment is present', () => {
      const parsed = SendMessageBodySchema.safeParse({
        message: '',
        attachment: {
          fileUrl: 'https://cdn.example/file.pdf',
          fileName: 'file.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
        },
      });

      expect(parsed.success).toBe(true);
    });

    // Người không tham gia không được gửi tin nhắn (NotFound).
    it('raises NotFound for a non-participant', async () => {
      repository.findConversationByIdForUser.mockResolvedValue(null);

      await expect(
        service.sendMessage(99, 1, 'Hello there'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.createMessage).not.toHaveBeenCalled();
    });
  });

  describe('UF-22 markAsRead', () => {
    // UF-22: Đánh dấu đã đọc trả về số tin nhắn đã cập nhật.
    it('returns the number of messages marked as read', async () => {
      repository.findConversationByIdForUser.mockResolvedValue(
        conversation(),
      );
      repository.markMessagesAsRead.mockResolvedValue({ count: 3 });

      await expect(service.markAsRead(10, 1)).resolves.toEqual({ count: 3 });
      expect(repository.markMessagesAsRead).toHaveBeenCalledWith(1, 10);
    });

    // Trả về count = 0 khi không có tin nhắn chưa đọc.
    it('returns {count: 0} when there are no unread messages', async () => {
      repository.findConversationByIdForUser.mockResolvedValue(
        conversation(),
      );
      repository.markMessagesAsRead.mockResolvedValue({ count: 0 });

      await expect(service.markAsRead(10, 1)).resolves.toEqual({ count: 0 });
    });

    // Người không tham gia không được đánh dấu đã đọc.
    it('raises NotFound for a non-participant', async () => {
      repository.findConversationByIdForUser.mockResolvedValue(null);

      await expect(service.markAsRead(99, 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.markMessagesAsRead).not.toHaveBeenCalled();
    });

    // Hội thoại không tồn tại trả về NotFound khi đánh dấu đã đọc.
    it('raises NotFound for a missing conversation', async () => {
      repository.findConversationByIdForUser.mockResolvedValue(null);

      await expect(service.markAsRead(10, 999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('UF-23 deleteMessage', () => {
    // UF-23: Người gửi thu hồi được tin nhắn của chính mình.
    it('recalls a message owned by the sender', async () => {
      repository.findConversationByIdForUser.mockResolvedValue(
        conversation(),
      );
      repository.softDeleteMessage.mockResolvedValue(true);

      await expect(service.deleteMessage(10, 1, 30)).resolves.toEqual({
        id: 30,
      });
      expect(repository.softDeleteMessage).toHaveBeenCalledWith(1, 30, 10);
    });

    // Không thu hồi được tin nhắn của người khác (NotFound).
    it("raises NotFound when recalling another user's message", async () => {
      repository.findConversationByIdForUser.mockResolvedValue(
        conversation(),
      );
      repository.softDeleteMessage.mockResolvedValue(false);

      await expect(service.deleteMessage(10, 1, 30)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // Tin nhắn không tồn tại trả về NotFound.
    it('raises NotFound when the message is missing', async () => {
      repository.findConversationByIdForUser.mockResolvedValue(
        conversation(),
      );
      repository.softDeleteMessage.mockResolvedValue(false);

      await expect(
        service.deleteMessage(10, 1, 999999),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Người không tham gia không được thu hồi tin nhắn.
    it('raises NotFound for a non-participant', async () => {
      repository.findConversationByIdForUser.mockResolvedValue(null);

      await expect(service.deleteMessage(99, 1, 30)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.softDeleteMessage).not.toHaveBeenCalled();
    });
  });

  describe('UF-24 pinConversation', () => {
    // UF-24: Ghim hội thoại và trả về pinnedAt.
    it('pins a conversation and returns pinnedAt', async () => {
      const pinnedAt = new Date('2026-02-01T00:00:00.000Z');
      repository.findConversationByIdForUser.mockResolvedValue(
        conversation(),
      );
      repository.setPinnedForUser.mockResolvedValue(pinnedAt);

      await expect(service.pinConversation(10, 1, true)).resolves.toEqual({
        id: 1,
        pinnedAt,
      });
      expect(repository.setPinnedForUser).toHaveBeenCalledWith(1, 10, true);
    });

    // Bỏ ghim hội thoại và trả về pinnedAt = null.
    it('unpins a conversation and returns pinnedAt = null', async () => {
      repository.findConversationByIdForUser.mockResolvedValue(
        conversation(),
      );
      repository.setPinnedForUser.mockResolvedValue(null);

      await expect(service.pinConversation(10, 1, false)).resolves.toEqual({
        id: 1,
        pinnedAt: null,
      });
      expect(repository.setPinnedForUser).toHaveBeenCalledWith(1, 10, false);
    });

    // Người không tham gia không được ghim hội thoại.
    it('raises NotFound for a non-participant', async () => {
      repository.findConversationByIdForUser.mockResolvedValue(null);

      await expect(service.pinConversation(99, 1, true)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.setPinnedForUser).not.toHaveBeenCalled();
    });

    // Hội thoại không tồn tại trả về NotFound khi ghim/bỏ ghim.
    it('raises NotFound for a missing conversation', async () => {
      repository.findConversationByIdForUser.mockResolvedValue(null);

      await expect(
        service.pinConversation(10, 999999, false),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('UF-25 uploadFile', () => {
    // UF-25: Tải lên tệp PDF 1 MB hợp lệ và trả về metadata đính kèm.
    it('accepts an allowed 1 MB PDF and returns attachment metadata', async () => {
      const file = multerFile({ size: 1024 * 1024 });
      repository.findConversationByIdForUser.mockResolvedValue(
        conversation(),
      );
      mockedUploadConversationFile.mockResolvedValue({
        secureUrl: 'https://cdn.example/document.pdf',
        bytes: file.size,
      });

      await expect(service.uploadFile(10, 1, file)).resolves.toEqual({
        fileUrl: 'https://cdn.example/document.pdf',
        fileName: 'document.pdf',
        fileSize: file.size,
        fileType: 'application/pdf',
      });
      expect(mockedUploadConversationFile).toHaveBeenCalledWith(file);
    });

    // Chấp nhận ảnh đúng giới hạn 25 MB (biên trên).
    it('accepts an allowed image at the 25 MB boundary', async () => {
      const file = multerFile({
        originalname: 'photo.png',
        mimetype: 'image/png',
        size: MAX_CONVERSATION_FILE_SIZE,
      });
      repository.findConversationByIdForUser.mockResolvedValue(
        conversation(),
      );
      mockedUploadConversationFile.mockResolvedValue({
        secureUrl: 'https://cdn.example/photo.png',
        bytes: file.size,
      });

      const result = await service.uploadFile(10, 1, file);

      expect(result.fileSize).toBe(MAX_CONVERSATION_FILE_SIZE);
    });

    // Giới hạn interceptor là 25 MB và lỗi quá dung lượng là PayloadTooLarge.
    it('uses a 25 MB interceptor limit and exposes a payload-too-large error', () => {
      expect(MAX_CONVERSATION_FILE_SIZE).toBe(25 * 1024 * 1024);
      expect(26 * 1024 * 1024).toBeGreaterThan(MAX_CONVERSATION_FILE_SIZE);
      expect(FileTooLargeException()).toBeInstanceOf(PayloadTooLargeException);
    });

    // Bộ lọc multer từ chối MIME type không nằm trong allow-list.
    it('rejects a disallowed MIME type in the multer filter', () => {
      const callback = jest.fn();

      conversationFileFilter(
        {} as never,
        { mimetype: 'application/x-msdownload' },
        callback,
      );

      expect(callback).toHaveBeenCalledWith(expect.any(BadRequestException), false);
      expect(isAllowedFileType('application/x-msdownload')).toBe(false);
      expect(isAllowedFileType('application/pdf')).toBe(true);
    });

    // Tải lên không có tệp trả về lỗi server.
    it('rejects an upload without a file', async () => {
      await expect(service.uploadFile(10, 1, undefined)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
      expect(repository.findConversationByIdForUser).not.toHaveBeenCalled();
    });

    // Người không tham gia không được tải tệp vào hội thoại.
    it('raises NotFound when a non-participant uploads to the conversation', async () => {
      repository.findConversationByIdForUser.mockResolvedValue(null);

      await expect(
        service.uploadFile(99, 1, multerFile()),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mockedUploadConversationFile).not.toHaveBeenCalled();
    });
  });
});
