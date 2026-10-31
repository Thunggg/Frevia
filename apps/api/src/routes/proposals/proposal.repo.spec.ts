import { HiringType, NotificationType, ProposalStatus } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { ProposalRepository } from './proposal.repo';

function createHireTransaction(overrides: {
  positionsFilled?: number;
  positionsRequired?: number;
}) {
  const hiredProposal = {
    id: 18,
    jobId: 10,
    freelancerId: 12,
    coverLetter: 'I can build this.',
    bidAmount: 700,
    deliveryDays: 19,
    status: ProposalStatus.HIRED,
    createdAt: new Date(),
    submittedAt: new Date(),
    acceptedAt: new Date(),
    rejectedAt: null,
    withdrawnAt: null,
    expiresAt: null,
    updatedAt: new Date(),
  };

  const transaction = {
    proposal: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest.fn().mockResolvedValue(hiredProposal),
    },
    job: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        positionsFilled: overrides.positionsFilled ?? 1,
        positionsRequired: overrides.positionsRequired ?? 1,
      }),
      update: jest.fn().mockResolvedValue({ id: 10 }),
    },
    contract: { create: jest.fn().mockResolvedValue({ id: 22 }) },
    notification: { create: jest.fn().mockResolvedValue({ id: 31 }) },
  };

  const prisma = {
    $transaction: jest.fn((callback: (client: typeof transaction) => unknown) =>
      callback(transaction),
    ),
  };

  return {
    transaction,
    repository: new ProposalRepository(prisma as unknown as PrismaService),
  };
}

describe('ProposalRepository', () => {
  it('hires a proposal, creates its contract, and notifies the freelancer atomically', async () => {
    const { transaction, repository } = createHireTransaction({});

    await expect(
      repository.hireProposal({
        proposalId: 18,
        jobId: 10,
        clientId: 4,
        freelancerId: 12,
        bidAmount: 700,
        jobTitle: 'AI Dev App',
        hiringType: HiringType.SINGLE,
        positionsRequired: 1,
      }),
    ).resolves.toMatchObject({
      id: 18,
      status: ProposalStatus.HIRED,
      bidAmount: 700,
    });

    expect(transaction.proposal.updateMany).toHaveBeenCalledWith({
      where: {
        id: 18,
        deletedAt: null,
        status: { in: [ProposalStatus.SUBMITTED, ProposalStatus.INTERVIEWING] },
      },
      data: {
        status: ProposalStatus.HIRED,
        acceptedAt: expect.any(Date) as unknown as Date,
        expiresAt: null,
      },
    });

    expect(transaction.job.updateMany).toHaveBeenCalledWith({
      where: { id: 10, positionsFilled: { lt: 1 } },
      data: { positionsFilled: { increment: 1 } },
    });

    expect(transaction.contract.create).toHaveBeenCalledWith({
      data: {
        jobId: 10,
        proposalId: 18,
        clientId: 4,
        freelancerId: 12,
        totalAmount: 700,
      },
      select: { id: true },
    });
    expect(transaction.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 12,
        type: NotificationType.PROPOSAL_ACCEPTED,
        title: 'Your proposal was accepted',
        message:
          'You have been hired for AI Dev App. Review and sign the contract to begin work.',
        data: {
          href: '/proposals/18',
          proposalId: 18,
          jobId: 10,
          contractId: 22,
          jobTitle: 'AI Dev App',
        },
      },
    });
  });

  it('rejects the remaining proposals only when the job hires a single freelancer', async () => {
    const single = createHireTransaction({});
    await single.repository.hireProposal({
      proposalId: 18,
      jobId: 10,
      clientId: 4,
      freelancerId: 12,
      bidAmount: 700,
      jobTitle: 'AI Dev App',
      hiringType: HiringType.SINGLE,
      positionsRequired: 1,
    });

    // Lần gọi đầu tiên chốt đề xuất được tuyển, lần thứ hai từ chối phần còn lại.
    expect(single.transaction.proposal.updateMany).toHaveBeenCalledTimes(2);
    expect(single.transaction.proposal.updateMany).toHaveBeenLastCalledWith({
      where: {
        jobId: 10,
        id: { not: 18 },
        deletedAt: null,
        status: { in: [ProposalStatus.SUBMITTED, ProposalStatus.INTERVIEWING] },
      },
      data: {
        status: ProposalStatus.REJECTED,
        rejectedAt: expect.any(Date) as unknown as Date,
      },
    });

    const multiple = createHireTransaction({
      positionsFilled: 2,
      positionsRequired: 3,
    });
    await multiple.repository.hireProposal({
      proposalId: 18,
      jobId: 10,
      clientId: 4,
      freelancerId: 12,
      bidAmount: 700,
      jobTitle: 'AI Dev App',
      hiringType: HiringType.MULTIPLE,
      positionsRequired: 3,
    });

    // MULTIPLE: chỉ chốt đề xuất được tuyển, các đề xuất khác giữ nguyên trạng thái.
    expect(multiple.transaction.proposal.updateMany).toHaveBeenCalledTimes(1);
    // Chưa đủ số vị trí nên job vẫn đang mở.
    expect(multiple.transaction.job.update).not.toHaveBeenCalled();
  });

  it('closes the job once every position is filled', async () => {
    const { transaction, repository } = createHireTransaction({
      positionsFilled: 3,
      positionsRequired: 3,
    });

    await repository.hireProposal({
      proposalId: 18,
      jobId: 10,
      clientId: 4,
      freelancerId: 12,
      bidAmount: 700,
      jobTitle: 'AI Dev App',
      hiringType: HiringType.MULTIPLE,
      positionsRequired: 3,
    });

    expect(transaction.job.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { status: 'IN_PROGRESS' },
    });
  });
});
