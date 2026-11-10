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

  it('rejects signing while contract status is AWAITING_PAYMENT', async () => {
    const { service } = buildService();

    await expect(service.signContract(10, 99)).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('enforces client must sign before freelancer', async () => {
    const { service } = buildService({
      findContractById: jest.fn().mockResolvedValue({
        id: 99,
        clientId: 10,
        freelancerId: 20,
        status: ContractStatus.PENDING_SIGN,
        signedByClient: false,
        signedByFreelancer: false,
        holdPaymentIntentId: 'pi_hold_1',
        expiresAt: new Date('2027-02-15T16:59:59.999Z'),
      }),
    });

    await expect(service.signContract(20, 99)).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('captures held payment intent when freelancer signs after client', async () => {
    const captureContractHold = jest.fn().mockResolvedValue({
      success: true,
      paymentIntentId: 'pi_hold_1',
      status: 'succeeded',
      message: 'Captured',
    });
    const signContract = jest.fn().mockResolvedValue({
      id: 99,
      status: ContractStatus.ACTIVE,
      signedByClient: true,
      signedByFreelancer: true,
    });
    const repository = {
      findContractById: jest.fn().mockResolvedValue({
        id: 99,
        clientId: 10,
        freelancerId: 20,
        status: ContractStatus.PENDING_SIGN,
        signedByClient: true,
        signedByFreelancer: false,
        holdPaymentIntentId: 'pi_hold_1',
        expiresAt: new Date('2027-02-15T16:59:59.999Z'),
      }),
      signContract,
    } as unknown as ContractRepository;
    const pdfService = {
      generateAndSaveContractPdf: jest.fn().mockResolvedValue(null),
    } as unknown as ContractPdfService;
    const service = new ContractService(repository, pdfService, {
      captureContractHold,
    } as unknown as PaymentService);

    const result = await service.signContract(20, 99);

    expect(captureContractHold).toHaveBeenCalledWith('pi_hold_1');
    expect(signContract).toHaveBeenCalledWith(99, 'freelancer');
    expect(result.status).toBe(ContractStatus.ACTIVE);
  });

  it('cancels held payment intent without refund fee when freelancer rejects', async () => {
    const cancelContractHold = jest.fn().mockResolvedValue({
      success: true,
      paymentIntentId: 'pi_hold_1',
      status: 'canceled',
      message: 'Canceled',
    });
    const refundContractEscrow = jest.fn().mockResolvedValue({ refundCount: 0 });
    const rejectContract = jest.fn().mockResolvedValue({
      id: 99,
      status: ContractStatus.REJECTED,
    });
    const repository = {
      findContractById: jest.fn().mockResolvedValue({
        id: 99,
        clientId: 10,
        freelancerId: 20,
        status: ContractStatus.PENDING_SIGN,
        holdPaymentIntentId: 'pi_hold_1',
        expiresAt: new Date('2027-02-15T16:59:59.999Z'),
      }),
      rejectContract,
    } as unknown as ContractRepository;
    const service = new ContractService(
      repository,
      {} as ContractPdfService,
      {
        cancelContractHold,
        refundContractEscrow,
      } as unknown as PaymentService,
    );

    const result = await service.rejectContract(20, 99, 'Budget mismatch');

    expect(cancelContractHold).toHaveBeenCalledWith(
      'pi_hold_1',
      'Budget mismatch',
    );
    expect(rejectContract).toHaveBeenCalledWith(99, 'Budget mismatch');
    expect(result.status).toBe(ContractStatus.REJECTED);
  });

  it('expires overdue contracts and cancels any payment hold', async () => {
    const cancelContractHold = jest.fn().mockResolvedValue({
      success: true,
      paymentIntentId: 'pi_hold_exp',
      status: 'canceled',
      message: 'Canceled',
    });
    const expireContract = jest.fn().mockResolvedValue({
      id: 99,
      status: ContractStatus.EXPIRED,
    });
    const repository = {
      findExpiredPendingContracts: jest.fn().mockResolvedValue([
        {
          id: 99,
          holdPaymentIntentId: 'pi_hold_exp',
        },
      ]),
      expireContract,
    } as unknown as ContractRepository;
    const service = new ContractService(
      repository,
      {} as ContractPdfService,
      {
        cancelContractHold,
      } as unknown as PaymentService,
    );

    await service.expireOverdueContracts();

    expect(cancelContractHold).toHaveBeenCalledWith(
      'pi_hold_exp',
      'Contract expired before both parties signed',
    );
    expect(expireContract).toHaveBeenCalledWith(99);
  });
});
