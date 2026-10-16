import { NotificationType, ProposalStatus } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { ProposalRepository } from './proposal.repo';

describe('ProposalRepository', () => {
  it('accepts a proposal, creates its contract, and notifies the freelancer atomically', async () => {
    const acceptedProposal = {
      id: 18,
      jobId: 10,
      freelancerId: 12,
      coverLetter: 'I can build this.',
      bidAmount: 700,
      deliveryDays: 19,
      status: ProposalStatus.ACCEPTED,
      createdAt: new Date(),
      submittedAt: new Date(),
      acceptedAt: new Date(),
      rejectedAt: null,
      withdrawnAt: null,
      updatedAt: new Date(),
    };
    const transaction = {
      proposal: {
        update: jest.fn().mockResolvedValue(acceptedProposal),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      job: { update: jest.fn().mockResolvedValue({ id: 10 }) },
      contract: { create: jest.fn().mockResolvedValue({ id: 22 }) },
      notification: { create: jest.fn().mockResolvedValue({ id: 31 }) },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const repository = new ProposalRepository(
      prisma as unknown as PrismaService,
    );

    await expect(
      repository.acceptProposal(18, 10, 4, 12, 700, 'AI Dev App'),
    ).resolves.toMatchObject({
      id: 18,
      status: ProposalStatus.ACCEPTED,
      bidAmount: 700,
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
          'Your proposal for AI Dev App was accepted. Review and sign the contract to begin work.',
        data: {
          href: '/proposals/18',
          proposalId: 18,
          jobId: 10,
          contractId: 22,
        },
      },
    });
  });
});
