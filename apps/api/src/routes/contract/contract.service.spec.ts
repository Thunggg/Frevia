import { UnprocessableEntityException } from '@nestjs/common';
import { ContractStatus } from '@prisma/client';
import type { CreateContractBodyType } from '@shared/types';
import { ContractPdfService } from '../../shared/services/contract-pdf.service';
import { PaymentService } from '../payments/payment.service';
import { ContractRepository } from './contract.repo';
import { ContractService } from './contract.service';

describe('ContractService date validation', () => {
  const buildService = (repoOverrides?: Partial<ContractRepository>) => {
    const createContract = jest
      .fn()
      .mockResolvedValue({ id: 99, slug: 'ctr-99' });
    const repository = {
      findProposalWithJob: jest.fn().mockResolvedValue({
        id: 1,
        status: 'SUBMITTED',
        freelancerId: 20,
        job: {
          id: 5,
          clientId: 10,
          title: 'Build Landing Page',
          hiringType: 'SINGLE',
          positionsFilled: 0,
          positionsRequired: 1,
        },
      }),
      findContractByProposalId: jest.fn().mockResolvedValue(null),
      createContract,
      findContractById: jest.fn().mockResolvedValue({
        id: 99,
        clientId: 10,
        freelancerId: 20,
        status: ContractStatus.AWAITING_PAYMENT,
        expiresAt: new Date('2027-02-15T16:59:59.999Z'),
      }),
      findContractMilestoneDueDates: jest.fn().mockResolvedValue([
        {
          id: 1,
          title: 'Phase 1',
          dueDate: new Date('2027-02-10T16:59:59.999Z'),
        },
      ]),
      updateContract: jest.fn().mockResolvedValue({ id: 99 }),
      ...repoOverrides,
    } as unknown as ContractRepository;

    const pdfService = {
      generateAndSaveContractPdf: jest.fn(),
      getContractPdfBuffer: jest.fn(),
    } as unknown as ContractPdfService;

    const paymentService = {} as PaymentService;

    return {
      service: new ContractService(repository, pdfService, paymentService),
      createContract,
    };
  };

  it('rejects creating a contract without expiresAt', async () => {
    const { service } = buildService();

    const bodyWithoutExpiry = {
      proposalId: 1,
      totalAmount: 500,
      milestones: [
        {
          title: 'Milestone 1',
          amount: 500,
          dueDate: '2027-02-01T16:59:59.999Z',
        },
      ],
    } as unknown as CreateContractBodyType;

    await expect(service.createContract(10, bodyWithoutExpiry)).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('rejects creating a contract when any milestone dueDate exceeds expiresAt', async () => {
    const { service } = buildService();

    await expect(
      service.createContract(10, {
        proposalId: 1,
        totalAmount: 500,
        expiresAt: '2027-02-10T16:59:59.999Z',
        milestones: [
          {
            title: 'Milestone 1',
            amount: 500,
            dueDate: '2027-02-15T16:59:59.999Z',
          },
        ],
      }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('allows creating a contract when milestone dueDate matches contract expiresAt', async () => {
    const { service, createContract } = buildService();

    await expect(
      service.createContract(10, {
        proposalId: 1,
        totalAmount: 500,
        expiresAt: '2027-02-10T16:59:59.999Z',
        milestones: [
          {
            title: 'Milestone 1',
            amount: 500,
            dueDate: '2027-02-10T16:59:59.999Z',
          },
        ],
      }),
    ).resolves.toEqual({ id: 99, slug: 'ctr-99' });

    expect(createContract).toHaveBeenCalledTimes(1);
  });

  it('rejects updating contract expiresAt earlier than existing milestone due dates', async () => {
    const { service } = buildService();

    await expect(
      service.updateContract(10, 99, {
        expiresAt: '2027-02-05T16:59:59.999Z',
      }),
    ).rejects.toThrow(UnprocessableEntityException);
  });
});
