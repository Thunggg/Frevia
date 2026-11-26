import { ContractStatus, JobStatus } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { ContractRepository } from './contract.repo';

describe('ContractRepository', () => {
  it('activates the contract and updates the job to IN_PROGRESS when both signatures and fees are paid', async () => {
    const signedContract = {
      id: 6,
      jobId: 10,
      signedByClient: true,
      signedByFreelancer: true,
      clientFeeStatus: 'PAID',
      freelancerFeeStatus: 'PAID',
      totalAmount: 700,
      platformFee: 7,
      clientPlatformFee: 0,
    };
    const activeContract = {
      ...signedContract,
      status: ContractStatus.ACTIVE,
    };
    const transaction = {
      contract: {
        update: jest
          .fn()
          .mockResolvedValueOnce(signedContract)
          .mockResolvedValueOnce(activeContract),
        findUnique: jest.fn().mockResolvedValue({
          id: 6,
          jobId: 10,
          proposalId: 1,
          status: ContractStatus.PENDING_SIGN,
        }),
      },
      proposal: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      job: {
        update: jest.fn().mockResolvedValue({ id: 10 }),
        findUnique: jest.fn().mockResolvedValue({
          id: 10,
          hiringType: 'SINGLE',
          positionsFilled: 1,
          positionsRequired: 1,
        }),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const repository = new ContractRepository(
      prisma as unknown as PrismaService,
    );

    await expect(repository.signContract(6, 'freelancer')).resolves.toEqual(
      activeContract,
    );
    expect(transaction.job.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { status: 'IN_PROGRESS' },
    });
    expect(transaction.contract.update).toHaveBeenLastCalledWith({
      where: { id: 6 },
      data: {
        status: ContractStatus.ACTIVE,
      },
    });
  });

  it('records signature but does not activate contract if only one party signed', async () => {
    const partiallySignedContract = {
      id: 6,
      jobId: 10,
      signedByClient: false,
      signedByFreelancer: true,
      clientFeeStatus: 'UNPAID',
      freelancerFeeStatus: 'UNPAID',
      clientPlatformFee: 0,
      status: ContractStatus.PENDING_SIGN,
      totalAmount: 700,
      platformFee: 7,
    };
    const transaction = {
      contract: {
        update: jest.fn().mockResolvedValue(partiallySignedContract),
      },
      job: { update: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const repository = new ContractRepository(
      prisma as unknown as PrismaService,
    );

    const result = await repository.signContract(6, 'freelancer');
    expect(result.status).toEqual(ContractStatus.PENDING_SIGN);
    expect(transaction.job.update).not.toHaveBeenCalled();
    expect(transaction.contract.update).toHaveBeenCalledWith({
      where: { id: 6 },
      data: {
        signedByFreelancer: true,
        freelancerSignedAt: expect.any(Date),
      },
    });
  });

  it('completes the contract and its job in one transaction', async () => {
    const completedContract = {
      id: 6,
      jobId: 10,
      status: ContractStatus.COMPLETED,
      totalAmount: 700,
      platformFee: 7,
    };
    const transaction = {
      contract: {
        update: jest.fn().mockResolvedValue(completedContract),
        count: jest.fn().mockResolvedValue(0),
      },
      job: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ positionsFilled: 1, positionsRequired: 1 }),
        update: jest.fn().mockResolvedValue({ id: 10 }),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const repository = new ContractRepository(
      prisma as unknown as PrismaService,
    );

    await expect(repository.completeContract(6, 10)).resolves.toEqual(
      completedContract,
    );
    expect(transaction.job.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { status: 'COMPLETED' },
    });
  });

  it('activates contract and expires remaining proposals when MULTIPLE hiringType reaches positionsRequired', async () => {
    const signedContract = {
      id: 7,
      jobId: 20,
      signedByClient: true,
      signedByFreelancer: true,
      clientFeeStatus: 'PAID',
      freelancerFeeStatus: 'PAID',
      totalAmount: 1000,
      platformFee: 10,
      clientPlatformFee: 0,
    };
    const activeContract = {
      ...signedContract,
      status: ContractStatus.ACTIVE,
    };
    const transaction = {
      contract: {
        update: jest
          .fn()
          .mockResolvedValueOnce(signedContract)
          .mockResolvedValueOnce(activeContract),
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          jobId: 20,
          proposalId: 105,
          status: ContractStatus.PENDING_SIGN,
        }),
      },
      proposal: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      job: {
        update: jest.fn().mockResolvedValue({ id: 20 }),
        findUnique: jest.fn().mockResolvedValue({
          id: 20,
          hiringType: 'MULTIPLE',
          positionsFilled: 3,
          positionsRequired: 3,
        }),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const repository = new ContractRepository(
      prisma as unknown as PrismaService,
    );

    await repository.signContract(7, 'freelancer');

    expect(transaction.proposal.updateMany).toHaveBeenCalledWith({
      where: {
        jobId: 20,
        id: { not: 105 },
        deletedAt: null,
        status: { in: ['SUBMITTED'] },
      },
      data: {
        status: 'EXPIRED',
        expiresAt: null,
      },
    });
    expect(transaction.job.update).toHaveBeenCalledWith({
      where: { id: 20 },
      data: { status: 'IN_PROGRESS' },
    });
  });

  it('rejectContract updates contract to REJECTED, restores proposal to SUBMITTED and decrements job positionsFilled by 1', async () => {
    const rejectedContract = {
      id: 8,
      jobId: 30,
      proposalId: 200,
      clientId: 50,
      slug: 'contract-slug-8',
      status: ContractStatus.REJECTED,
      totalAmount: 500,
      platformFee: 5,
    };
    const transaction = {
      contract: {
        update: jest.fn().mockResolvedValue(rejectedContract),
      },
      proposal: {
        update: jest.fn().mockResolvedValue({ id: 200, status: 'SUBMITTED' }),
      },
      job: {
        update: jest.fn().mockResolvedValue({ id: 30 }),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const repository = new ContractRepository(
      prisma as unknown as PrismaService,
    );

    const result = await repository.rejectContract(8, 'Not available anymore');

    expect(transaction.contract.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data: expect.objectContaining({
        status: ContractStatus.REJECTED,
        rejectReason: 'Not available anymore',
      }),
    });
    expect(transaction.proposal.update).toHaveBeenCalledWith({
      where: { id: 200 },
      data: { status: 'SUBMITTED' },
    });
    expect(transaction.job.update).toHaveBeenCalledWith({
      where: { id: 30 },
      data: { positionsFilled: { decrement: 1 } },
    });
    expect(result.status).toEqual(ContractStatus.REJECTED);
  });

  it('cancelContract updates contract to CANCELLED, proposal to REJECTED and decrements job positionsFilled by 1', async () => {
    const cancelledContract = {
      id: 9,
      jobId: 35,
      proposalId: 205,
      clientId: 55,
      slug: 'contract-slug-9',
      status: ContractStatus.CANCELLED,
      totalAmount: 600,
      clientPlatformFee: 18,
      platformFee: 18,
    };
    const transaction = {
      contract: {
        findUnique: jest.fn().mockResolvedValue({
          id: 9,
          jobId: 35,
          proposalId: 205,
          status: ContractStatus.ACTIVE,
        }),
        update: jest.fn().mockResolvedValue(cancelledContract),
      },
      proposal: {
        update: jest.fn().mockResolvedValue({ id: 205, status: 'REJECTED' }),
      },
      job: {
        findUnique: jest.fn().mockResolvedValue({
          id: 35,
          status: JobStatus.IN_PROGRESS,
          positionsFilled: 1,
          positionsRequired: 1,
        }),
        update: jest.fn().mockResolvedValue({ id: 35 }),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const repository = new ContractRepository(
      prisma as unknown as PrismaService,
    );

    const result = await repository.cancelContract(9);

    expect(transaction.contract.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: {
        status: ContractStatus.CANCELLED,
        holdPaymentIntentId: null,
        holdMilestoneIds: [],
      },
    });
    expect(transaction.proposal.update).toHaveBeenCalledWith({
      where: { id: 205 },
      data: { status: 'REJECTED' },
    });
    expect(transaction.job.update).toHaveBeenCalledWith({
      where: { id: 35 },
      data: {
        positionsFilled: { decrement: 1 },
        status: JobStatus.OPEN,
      },
    });
    expect(result.status).toEqual(ContractStatus.CANCELLED);
  });

  it('does NOT mark job COMPLETED when completing one contract if other contracts for MULTIPLE job are still open', async () => {
    const completedContract = {
      id: 9,
      jobId: 40,
      status: ContractStatus.COMPLETED,
      totalAmount: 500,
      platformFee: 5,
    };
    const transaction = {
      contract: {
        update: jest.fn().mockResolvedValue(completedContract),
        // Còn 2 hợp đồng khác vẫn đang mở (ACTIVE / PENDING)
        count: jest.fn().mockResolvedValue(2),
      },
      job: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ positionsFilled: 3, positionsRequired: 3 }),
        update: jest.fn(),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const repository = new ContractRepository(
      prisma as unknown as PrismaService,
    );

    await repository.completeContract(9, 40);

    // Job KHÔNG được đánh dấu COMPLETED vì vẫn còn hợp đồng khác đang mở
    expect(transaction.job.update).not.toHaveBeenCalled();
  });

  it('marks job COMPLETED when the last remaining contract for MULTIPLE job is completed', async () => {
    const completedContract = {
      id: 10,
      jobId: 40,
      status: ContractStatus.COMPLETED,
      totalAmount: 500,
      platformFee: 5,
    };
    const transaction = {
      contract: {
        update: jest.fn().mockResolvedValue(completedContract),
        // Không còn hợp đồng nào khác đang mở
        count: jest.fn().mockResolvedValue(0),
      },
      job: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ positionsFilled: 3, positionsRequired: 3 }),
        update: jest.fn().mockResolvedValue({ id: 40 }),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const repository = new ContractRepository(
      prisma as unknown as PrismaService,
    );

    await repository.completeContract(10, 40);

    // Job ĐÃ được đánh dấu COMPLETED vì đã hoàn thành toàn bộ hợp đồng
    expect(transaction.job.update).toHaveBeenCalledWith({
      where: { id: 40 },
      data: { status: 'COMPLETED' },
    });
  });
});
