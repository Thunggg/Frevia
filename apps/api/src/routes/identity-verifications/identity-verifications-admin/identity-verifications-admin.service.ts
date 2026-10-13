import { Injectable } from '@nestjs/common';
import { VerificationStatus } from '@prisma/client';
import { isAbsolute, relative, resolve } from 'path';
import {
  IdentityVerificationAlreadyReviewedException,
  IdentityVerificationFileInvalidException,
  IdentityVerificationNotFoundException,
} from './identity-verifications-admin.error';
import { IdentityVerificationsAdminRepository } from './identity-verifications-admin.repo';

type ReviewableStatus =
  | typeof VerificationStatus.APPROVED
  | typeof VerificationStatus.REJECTED;

@Injectable()
export class IdentityVerificationsAdminService {
  constructor(
    private readonly repository: IdentityVerificationsAdminRepository,
  ) {}

  private presentFileUrl<T extends { id: number; fileUrl: string }>(
    document: T,
  ) {
    return document.fileUrl.startsWith('local://')
      ? {
          ...document,
          fileUrl: `/api/backend/admin/identity-verifications/${document.id}/file`,
        }
      : document;
  }

  private presentList<T extends { id: number; fileUrl: string }>(
    documents: T[],
  ) {
    return documents.map((document) => this.presentFileUrl(document));
  }

  async list(params: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
  }) {
    const status = params.status as VerificationStatus | undefined;
    const result = await this.repository.findDocuments({
      page: params.page,
      limit: params.limit,
      status,
      search: params.search || undefined,
    });

    return {
      documents: this.presentList(result.documents),
      pagination: {
        page: params.page,
        limit: params.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / params.limit),
      },
    };
  }

  async detail(id: number) {
    const document = await this.repository.findDocumentById(id);
    if (!document) throw IdentityVerificationNotFoundException();
    return this.presentFileUrl(document);
  }

  async review(
    id: number,
    adminId: number,
    status: ReviewableStatus,
    reviewNotes: string | null,
  ) {
    const document = await this.repository.findDocumentRaw(id);
    if (!document) throw IdentityVerificationNotFoundException();
    if (document.status !== VerificationStatus.PENDING) {
      throw IdentityVerificationAlreadyReviewedException();
    }

    const reviewed = await this.repository.reviewDocument(
      id,
      adminId,
      status,
      reviewNotes,
    );
    if (!reviewed) throw IdentityVerificationNotFoundException();
    return this.presentFileUrl(reviewed);
  }

  async getLocalFile(id: number) {
    const document = await this.repository.findDocumentRaw(id);
    if (!document) throw IdentityVerificationNotFoundException();
    if (!document.fileUrl.startsWith('local://')) {
      throw IdentityVerificationFileInvalidException();
    }

    const relativePath = document.fileUrl.slice('local://'.length);
    const uploadsRoot = resolve(process.cwd(), 'uploads');
    const absolutePath = resolve(uploadsRoot, relativePath);
    const pathFromUploadsRoot = relative(uploadsRoot, absolutePath);
    if (
      pathFromUploadsRoot.startsWith('..') ||
      isAbsolute(pathFromUploadsRoot)
    ) {
      throw IdentityVerificationFileInvalidException();
    }

    return {
      absolutePath,
      fileName: relativePath.split('/').at(-1) ?? 'document',
    };
  }
}
