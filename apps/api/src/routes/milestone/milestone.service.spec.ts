import { UnprocessableEntityException } from '@nestjs/common';
import { ContractStatus, MilestoneStatus } from '@prisma/client';
import type { CreateMilestoneBodyType } from '@shared/types';
import { MilestoneRepository } from './milestone.repo';
import { MilestoneService } from './milestone.service';

describe('MilestoneService date validation', () => {
  const buildService = (repoOverrides?: Partial<MilestoneRepository>) => {
    const createMilestone = jest.fn().mockResolvedValue({ id: 102 });
    const updateMilestone = jest.fn().mockResolvedValue({ id: 101 });
    const repository = {
      findContractById: jest.fn().mockResolvedValue({
        id: 50,
        clientId: 10,
        freelancerId: 20,
        status: ContractStatus.AWAITING_PAYMENT,
        totalAmount: 1000,
        expiresAt: new Date('2027-02-20T16:59:59.999Z'),
      }),
      getTotalMilestoneAmount: jest.fn().mockResolvedValue(200),
      findMilestoneById: jest.fn().mockResolvedValue({
        id: 101,
        contractId: 50,
        status: MilestoneStatus.PENDING,
        amount: 200,
        dueDate: new Date('2027-02-10T16:59:59.999Z'),
      }),
      createMilestone,
      updateMilestone,
      ...repoOverrides,
    } as unknown as MilestoneRepository;

    return {
      service: new MilestoneService(repository),
      createMilestone,
      updateMilestone,
    };
  };

  it('rejects creating a milestone without dueDate', async () => {
    const { service } = buildService();

    const bodyWithoutDueDate = {
      title: 'Milestone 1',
      amount: 300,
    } as unknown as CreateMilestoneBodyType;

    await expect(
      service.createMilestone(10, 50, bodyWithoutDueDate),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('rejects creating a milestone when dueDate exceeds contract expiresAt', async () => {
    const { service } = buildService();

    await expect(
      service.createMilestone(10, 50, {
        title: 'Milestone Late',
        amount: 300,
        dueDate: '2027-02-25T16:59:59.999Z',
      }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('allows creating a milestone when dueDate is on or before contract expiresAt', async () => {
    const { service, createMilestone } = buildService();

    await expect(
      service.createMilestone(10, 50, {
        title: 'Milestone On Time',
        amount: 300,
        dueDate: '2027-02-20T16:59:59.999Z',
      }),
    ).resolves.toEqual({ id: 102 });

    expect(createMilestone).toHaveBeenCalledTimes(1);
  });

  it('rejects updating a milestone with dueDate exceeding contract expiresAt', async () => {
    const { service } = buildService();

    await expect(
      service.updateMilestone(10, 50, 101, {
        dueDate: '2027-02-22T16:59:59.999Z',
      }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('allows updating a milestone with dueDate within contract expiresAt', async () => {
    const { service, updateMilestone } = buildService();

    await expect(
      service.updateMilestone(10, 50, 101, {
        dueDate: '2027-02-18T16:59:59.999Z',
      }),
    ).resolves.toEqual({ id: 101 });

    expect(updateMilestone).toHaveBeenCalledTimes(1);
  });
});
