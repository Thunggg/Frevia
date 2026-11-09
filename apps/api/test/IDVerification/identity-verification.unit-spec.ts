import { ConflictException, NotFoundException } from '@nestjs/common';
import { VerificationStatus } from '@prisma/client';
import {
  ApproveIdentityVerificationBodySchema,
  IdentityVerificationAdminFilterSchema,
  RejectIdentityVerificationBodySchema,
} from '@shared/types';
import { IdentityVerificationsAdminRepository } from '../../src/routes/identity-verifications/identity-verifications-admin/identity-verifications-admin.repo';
import { IdentityVerificationsAdminService } from '../../src/routes/identity-verifications/identity-verifications-admin/identity-verifications-admin.service';

describe('Admin identity verification (UF-29 to UF-32)', () => {
  const repository = {
    findDocuments: jest.fn(),
    findDocumentById: jest.fn(),
    findDocumentRaw: jest.fn(),
    reviewDocument: jest.fn(),
  };

  const service = new IdentityVerificationsAdminService(
    repository as unknown as IdentityVerificationsAdminRepository,
  );

  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const reviewedAt = new Date('2026-01-02T00:00:00.000Z');

  const listDocument = {
    id: 1,
    userId: 10,
    documentType: 'CCCD',
    fileUrl: 'https://cdn.example/front.jpg',
    backFileUrl: 'https://cdn.example/back.jpg',
    status: VerificationStatus.PENDING,
    reviewNotes: null,
    createdAt,
    reviewedAt: null,
    user: {
      id: 10,
      email: 'alice@example.com',
      profile: { displayName: 'Alice', avatarUrl: null },
    },
  };

  const detailDocument = (
    status: VerificationStatus = VerificationStatus.PENDING,
    idVerified = false,
  ) => ({
    ...listDocument,
    status,
    reviewedAt: status === VerificationStatus.PENDING ? null : reviewedAt,
    admin:
      status === VerificationStatus.PENDING
        ? null
        : {
            id: 99,
            email: 'admin@example.com',
            profile: { displayName: 'Admin' },
          },
    user: {
      id: 10,
      email: 'alice@example.com',
      createdAt,
      profile: {
        displayName: 'Alice',
        avatarUrl: null,
        bio: 'Freelancer',
        freelancerProfile: {
          title: 'Developer',
          idVerified,
        },
      },
    },
  });

  const rawDocument = (
    status: VerificationStatus = VerificationStatus.PENDING,
  ) => ({
    id: 1,
    userId: 10,
    fileUrl: 'https://cdn.example/front.jpg',
    backFileUrl: null,
    status,
  });

  beforeEach(() => jest.clearAllMocks());

  describe('UF-29 list', () => {
    // UF-29: Trả về danh sách yêu cầu xác minh kèm metadata phân trang.
    it('returns the paginated verification list', async () => {
      repository.findDocuments.mockResolvedValue({
        documents: [listDocument],
        total: 21,
      });

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.documents).toEqual([listDocument]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 21,
        totalPages: 3,
      });
    });

    // Bộ lọc trạng thái PENDING được truyền xuống repository.
    it('passes the PENDING status filter to the repository', async () => {
      repository.findDocuments.mockResolvedValue({
        documents: [listDocument],
        total: 1,
      });

      await service.list({
        page: 1,
        limit: 10,
        status: VerificationStatus.PENDING,
      });

      expect(repository.findDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ status: VerificationStatus.PENDING }),
      );
    });

    // Bộ lọc tìm kiếm theo email được truyền xuống repository.
    it('passes the email search filter to the repository', async () => {
      repository.findDocuments.mockResolvedValue({
        documents: [listDocument],
        total: 1,
      });

      await service.list({ page: 1, limit: 10, search: 'alice@example.com' });

      expect(repository.findDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'alice@example.com' }),
      );
    });

    // Không có yêu cầu phù hợp trả về mảng rỗng, totalPages = 0.
    it('returns an empty list when no verification request matches', async () => {
      repository.findDocuments.mockResolvedValue({
        documents: [],
        total: 0,
      });

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.documents).toEqual([]);
      expect(result.pagination.totalPages).toBe(0);
    });

    // Schema từ chối page = 0.
    it('rejects page=0 through IdentityVerificationAdminFilterSchema', () => {
      const parsed = IdentityVerificationAdminFilterSchema.safeParse({
        page: '0',
        limit: '10',
      });

      expect(parsed.success).toBe(false);
    });

    // Schema từ chối limit = 101 (vượt giới hạn 100).
    it('rejects limit=101 through IdentityVerificationAdminFilterSchema', () => {
      const parsed = IdentityVerificationAdminFilterSchema.safeParse({
        page: '1',
        limit: '101',
      });

      expect(parsed.success).toBe(false);
    });
  });

  describe('UF-30 detail', () => {
    // UF-30: Trả về chi tiết yêu cầu đang chờ kèm URL giấy tờ.
    it('returns a pending verification request with document URLs', async () => {
      repository.findDocumentById.mockResolvedValue(detailDocument());

      await expect(service.detail(1)).resolves.toEqual(detailDocument());
    });

    // Yêu cầu đã duyệt trả về kèm thông tin Admin duyệt và idVerified.
    it('returns an approved verification request with reviewer info', async () => {
      const approved = detailDocument(VerificationStatus.APPROVED, true);
      repository.findDocumentById.mockResolvedValue(approved);

      const result = await service.detail(1);

      expect(result.status).toBe(VerificationStatus.APPROVED);
      expect(result.admin).toEqual(approved.admin);
      expect(result.user.profile?.freelancerProfile?.idVerified).toBe(true);
    });

    // Yêu cầu không tồn tại trả về NotFound.
    it('raises NotFound for a missing request', async () => {
      repository.findDocumentById.mockResolvedValue(null);

      await expect(service.detail(999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // Yêu cầu không có mặt sau trả về backFileUrl = null.
    it('returns backFileUrl = null when the request has no back file', async () => {
      repository.findDocumentById.mockResolvedValue({
        ...detailDocument(),
        backFileUrl: null,
      });

      const result = await service.detail(1);

      expect(result.backFileUrl).toBeNull();
    });

    // URL file local:// được chuyển thành URL tải file qua API admin.
    it('converts local front and back files to admin file URLs', async () => {
      repository.findDocumentById.mockResolvedValue({
        ...detailDocument(),
        fileUrl: 'local://front.jpg',
        backFileUrl: 'local://back.jpg',
      });

      const result = await service.detail(1);

      expect(result.fileUrl).toBe(
        '/api/backend/admin/identity-verifications/1/file',
      );
      expect(result.backFileUrl).toBe(
        '/api/backend/admin/identity-verifications/1/file?side=back',
      );
    });

    // Yêu cầu đã duyệt vẫn giữ thông tin người duyệt.
    it('keeps reviewer data on an already reviewed request', async () => {
      repository.findDocumentById.mockResolvedValue(
        detailDocument(VerificationStatus.REJECTED, false),
      );

      const result = await service.detail(1);

      expect(result.admin?.email).toBe('admin@example.com');
    });
  });

  describe('UF-31 review (approve)', () => {
    // UF-31: Admin duyệt yêu cầu PENDING với ghi chú hợp lệ.
    it('approves a pending request with a valid note', async () => {
      const approved = detailDocument(VerificationStatus.APPROVED, true);
      repository.findDocumentRaw.mockResolvedValue(rawDocument());
      repository.reviewDocument.mockResolvedValue(approved);

      await expect(
        service.review(
          1,
          99,
          VerificationStatus.APPROVED,
          'Documents verified',
        ),
      ).resolves.toEqual(approved);
      expect(repository.reviewDocument).toHaveBeenCalledWith(
        1,
        99,
        VerificationStatus.APPROVED,
        'Documents verified',
      );
    });

    // Duyệt được với ghi chú null.
    it('approves a pending request with a null note', async () => {
      repository.findDocumentRaw.mockResolvedValue(rawDocument());
      repository.reviewDocument.mockResolvedValue(
        detailDocument(VerificationStatus.APPROVED, true),
      );

      await service.review(1, 99, VerificationStatus.APPROVED, null);

      expect(repository.reviewDocument).toHaveBeenCalledWith(
        1,
        99,
        VerificationStatus.APPROVED,
        null,
      );
    });

    // Chấp nhận ghi chú đúng 1000 ký tự (biên trên).
    it('accepts a review note of exactly 1000 characters', () => {
      const parsed = ApproveIdentityVerificationBodySchema.safeParse({
        reviewNotes: 'a'.repeat(1000),
      });

      expect(parsed.success).toBe(true);
    });

    // Không duyệt lại được yêu cầu đã APPROVED (Conflict).
    it('rejects approving an already approved request', async () => {
      repository.findDocumentRaw.mockResolvedValue(
        rawDocument(VerificationStatus.APPROVED),
      );

      await expect(
        service.review(1, 99, VerificationStatus.APPROVED, 'Again'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.reviewDocument).not.toHaveBeenCalled();
    });

    // Không duyệt được yêu cầu đã REJECTED (Conflict).
    it('rejects approving an already rejected request', async () => {
      repository.findDocumentRaw.mockResolvedValue(
        rawDocument(VerificationStatus.REJECTED),
      );

      await expect(
        service.review(1, 99, VerificationStatus.APPROVED, 'Again'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // Duyệt yêu cầu không tồn tại trả về NotFound.
    it('raises NotFound when approving a missing request', async () => {
      repository.findDocumentRaw.mockResolvedValue(null);

      await expect(
        service.review(999999, 99, VerificationStatus.APPROVED, 'Note'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Schema từ chối ghi chú 1001 ký tự.
    it('rejects a review note of 1001 characters', () => {
      const parsed = ApproveIdentityVerificationBodySchema.safeParse({
        reviewNotes: 'a'.repeat(1001),
      });

      expect(parsed.success).toBe(false);
    });
  });

  describe('UF-32 review (reject)', () => {
    // UF-32: Admin từ chối yêu cầu PENDING với ghi chú hợp lệ.
    it('rejects a pending request with a valid note', async () => {
      const rejected = detailDocument(VerificationStatus.REJECTED, false);
      repository.findDocumentRaw.mockResolvedValue(rawDocument());
      repository.reviewDocument.mockResolvedValue(rejected);

      await expect(
        service.review(
          1,
          99,
          VerificationStatus.REJECTED,
          'Document is blurry',
        ),
      ).resolves.toEqual(rejected);
      expect(repository.reviewDocument).toHaveBeenCalledWith(
        1,
        99,
        VerificationStatus.REJECTED,
        'Document is blurry',
      );
    });

    // Từ chối được với ghi chú null.
    it('rejects a pending request with a null note', async () => {
      repository.findDocumentRaw.mockResolvedValue(rawDocument());
      repository.reviewDocument.mockResolvedValue(
        detailDocument(VerificationStatus.REJECTED, false),
      );

      await service.review(1, 99, VerificationStatus.REJECTED, null);

      expect(repository.reviewDocument).toHaveBeenCalledWith(
        1,
        99,
        VerificationStatus.REJECTED,
        null,
      );
    });

    // Chấp nhận ghi chú đúng 1000 ký tự (biên trên).
    it('accepts a review note of exactly 1000 characters', () => {
      const parsed = RejectIdentityVerificationBodySchema.safeParse({
        reviewNotes: 'a'.repeat(1000),
      });

      expect(parsed.success).toBe(true);
    });

    // Không từ chối lại được yêu cầu đã APPROVED (Conflict).
    it('rejects rejecting an already approved request', async () => {
      repository.findDocumentRaw.mockResolvedValue(
        rawDocument(VerificationStatus.APPROVED),
      );

      await expect(
        service.review(1, 99, VerificationStatus.REJECTED, 'Again'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.reviewDocument).not.toHaveBeenCalled();
    });

    // Không từ chối lại được yêu cầu đã REJECTED (Conflict).
    it('rejects rejecting an already rejected request', async () => {
      repository.findDocumentRaw.mockResolvedValue(
        rawDocument(VerificationStatus.REJECTED),
      );

      await expect(
        service.review(1, 99, VerificationStatus.REJECTED, 'Again'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // Từ chối yêu cầu không tồn tại trả về NotFound.
    it('raises NotFound when rejecting a missing request', async () => {
      repository.findDocumentRaw.mockResolvedValue(null);

      await expect(
        service.review(999999, 99, VerificationStatus.REJECTED, 'Note'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Schema từ chối ghi chú 1001 ký tự.
    it('rejects a review note of 1001 characters', () => {
      const parsed = RejectIdentityVerificationBodySchema.safeParse({
        reviewNotes: 'a'.repeat(1001),
      });

      expect(parsed.success).toBe(false);
    });
  });
});
