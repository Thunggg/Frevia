import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateForumReportSchema, RoleName } from '@shared/types';
import { ForumReportRepository } from '../../src/routes/forums/forums-reports/forums-reports.repo';
import { ForumReportService } from '../../src/routes/forums/forums-reports/forums-reports.service';

describe('Forum reports (UF-17)', () => {
  const repository = {
    findPostById: jest.fn(),
    findCommentById: jest.fn(),
    findExistingReport: jest.fn(),
    createReport: jest.fn(),
    getReportList: jest.fn(),
    findReportById: jest.fn(),
    updateReportStatus: jest.fn(),
  };

  const service = new ForumReportService(
    repository as unknown as ForumReportRepository,
  );

  const createdAt = new Date('2026-01-01T00:00:00.000Z');

  const postReport = {
    id: 1,
    reporterId: 10,
    postId: 1,
    commentId: null,
    reason: 'Spam content',
    status: 'PENDING' as const,
    adminId: null,
    createdAt,
  };

  const commentReport = {
    ...postReport,
    id: 2,
    postId: 1,
    commentId: 3,
  };

  beforeEach(() => jest.clearAllMocks());

  // UF-17: Tạo báo cáo PENDING cho bài viết tồn tại.
  it('creates a PENDING report for an existing post', async () => {
    repository.findPostById.mockResolvedValue({ id: 1 });
    repository.findExistingReport.mockResolvedValue(null);
    repository.createReport.mockResolvedValue(postReport);

    await expect(
      service.createPostReport(10, 1, 'Spam content'),
    ).resolves.toEqual(postReport);
    expect(repository.createReport).toHaveBeenCalledWith(
      10,
      1,
      null,
      'Spam content',
    );
  });

  // Tạo báo cáo PENDING cho bình luận tồn tại.
  it('creates a PENDING report for an existing comment', async () => {
    repository.findCommentById.mockResolvedValue({ id: 3, postId: 1 });
    repository.findExistingReport.mockResolvedValue(null);
    repository.createReport.mockResolvedValue(commentReport);

    await expect(
      service.createCommentReport(10, 1, 3, 'Spam content'),
    ).resolves.toEqual(commentReport);
    expect(repository.createReport).toHaveBeenCalledWith(
      10,
      1,
      3,
      'Spam content',
    );
  });

  // Schema từ chối lý do rỗng.
  it('rejects an empty reason at the schema level', () => {
    const parsed = CreateForumReportSchema.safeParse({ reason: '' });

    expect(parsed.success).toBe(false);
  });

  // Bài viết bị báo cáo không tồn tại trả về NotFound.
  it('raises NotFound when the reported post is missing', async () => {
    repository.findPostById.mockResolvedValue(null);

    await expect(
      service.createPostReport(10, 999999, 'Spam content'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.createReport).not.toHaveBeenCalled();
  });

  // Bình luận bị báo cáo không tồn tại trả về NotFound.
  it('raises NotFound when the reported comment is missing', async () => {
    repository.findCommentById.mockResolvedValue(null);

    await expect(
      service.createCommentReport(10, 1, 999999, 'Spam content'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.createReport).not.toHaveBeenCalled();
  });

  // Bình luận không thuộc bài viết bị báo cáo trả về NotFound.
  it('raises NotFound when the comment does not belong to the post', async () => {
    repository.findCommentById.mockResolvedValue({ id: 3, postId: 2 });

    await expect(
      service.createCommentReport(10, 1, 3, 'Spam content'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.createReport).not.toHaveBeenCalled();
  });

  // Không cho phép báo cáo trùng cùng một bài viết (Forbidden).
  it('rejects a duplicate report for the same post', async () => {
    repository.findPostById.mockResolvedValue({ id: 1 });
    repository.findExistingReport.mockResolvedValue({ id: 99 });

    await expect(
      service.createPostReport(10, 1, 'Spam content'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.createReport).not.toHaveBeenCalled();
  });

  // Không cho phép báo cáo trùng cùng một bình luận (Forbidden).
  it('rejects a duplicate report for the same comment', async () => {
    repository.findCommentById.mockResolvedValue({ id: 3, postId: 1 });
    repository.findExistingReport.mockResolvedValue({ id: 99 });

    await expect(
      service.createCommentReport(10, 1, 3, 'Spam content'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.createReport).not.toHaveBeenCalled();
  });

  // Chỉ Admin được xem danh sách báo cáo; Client bị chặn 403.
  it('keeps report listing restricted to administrators', async () => {
    await expect(
      service.getForumReportLists(RoleName.CLIENT, 1, 10),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.getReportList).not.toHaveBeenCalled();
  });
});
