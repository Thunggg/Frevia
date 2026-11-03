import { ContractStatus } from '@prisma/client';
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
      },
      job: { update: jest.fn().mockResolvedValue({ id: 10 }) },
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
        signedAt: expect.any(Date),
      },
    });
  });

  it('records signature but does not activate contract if platform fees are unpaid', async () => {
    const signedContract = {
      id: 6,
      jobId: 10,
      signedByClient: true,
      signedByFreelancer: true,
      clientFeeStatus: 'UNPAID',
      freelancerFeeStatus: 'UNPAID',
      status: ContractStatus.PENDING_SIGN,
      totalAmount: 700,
      platformFee: 7,
    };
    const updatedContract = {
      ...signedContract,
      signedAt: new Date(),
    };
    const transaction = {
      contract: {
        update: jest
          .fn()
          .mockResolvedValueOnce(signedContract)
          .mockResolvedValueOnce(updatedContract),
      },
      job: { update: jest.fn().mockResolvedValue({ id: 10 }) },
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
    expect(transaction.contract.update).toHaveBeenLastCalledWith({
      where: { id: 6 },
      data: {
        signedAt: expect.any(Date),
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
      contract: { update: jest.fn().mockResolvedValue(completedContract) },
      job: { update: jest.fn().mockResolvedValue({ id: 10 }) },
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
});
