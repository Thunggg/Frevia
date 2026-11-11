import {
  ContractStatus,
  HiringType,
  JobStatus,
  MilestonePaymentStatus,
  NotificationType,
  PlatformFeeStatus,
  Prisma,
  ProposalStatus,
} from '@prisma/client';

/**
 * Kích hoạt hợp đồng khi cả 2 bên đã ký và cả 2 bên đã thanh toán phí nền tảng:
 * - Chuyển contract.status sang ACTIVE.
 * - Đối với job SINGLE: các proposal còn lại (SUBMITTED / INTERVIEWING) chuyển sang REJECTED; job chuyển sang IN_PROGRESS.
 * - Đối với job MULTIPLE: nếu positionsFilled >= positionsRequired thì các proposal còn lại chuyển sang EXPIRED; job chuyển sang IN_PROGRESS.
 */
export async function activateContractLifecycle(
  tx: Prisma.TransactionClient,
  contractId: number,
) {
  const contract = await tx.contract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      jobId: true,
      proposalId: true,
      status: true,
    },
  });

  if (!contract) return null;

  const activatedContract = await tx.contract.update({
    where: { id: contractId },
    data: {
      status: ContractStatus.ACTIVE,
    },
  });

  const job = await tx.job.findUnique({
    where: { id: contract.jobId },
    select: {
      id: true,
      hiringType: true,
      positionsFilled: true,
      positionsRequired: true,
    },
  });

  if (job) {
    const now = new Date();
    if (job.hiringType === HiringType.SINGLE) {
      await tx.proposal.updateMany({
        where: {
          jobId: job.id,
          id: { not: contract.proposalId },
          deletedAt: null,
          status: {
            in: [ProposalStatus.SUBMITTED, ProposalStatus.INTERVIEWING],
          },
        },
        data: {
          status: ProposalStatus.REJECTED,
          rejectedAt: now,
          expiresAt: null,
        },
      });

      await tx.job.update({
        where: { id: job.id },
        data: { status: JobStatus.IN_PROGRESS },
      });
    } else if (job.hiringType === HiringType.MULTIPLE) {
      if (job.positionsFilled >= job.positionsRequired) {
        await tx.proposal.updateMany({
          where: {
            jobId: job.id,
            id: { not: contract.proposalId },
            deletedAt: null,
            status: {
              in: [ProposalStatus.SUBMITTED, ProposalStatus.INTERVIEWING],
            },
          },
          data: {
            status: ProposalStatus.EXPIRED,
            expiresAt: null,
          },
        });

        await tx.job.update({
          where: { id: job.id },
          data: { status: JobStatus.IN_PROGRESS },
        });
      }
    }
  }

  return activatedContract;
}

/**
 * Kiểm tra khi một milestone vừa được release (hoặc settled):
 * Nếu không còn milestone nào chưa giải ngân / đang giữ / tranh chấp (`PENDING`, `FUNDED`, `DISPUTED`)
 * và có ít nhất 1 milestone đã `RELEASED`, tự động chuyển cả `Contract` và `Job` sang `COMPLETED`.
 */
export async function syncContractAndJobCompletion(
  tx: Prisma.TransactionClient,
  contractId: number,
): Promise<boolean> {
  const contract = await tx.contract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      slug: true,
      jobId: true,
      clientId: true,
      freelancerId: true,
      status: true,
      freelancerFeePaidAt: true,
      job: {
        select: {
          id: true,
          title: true,
          status: true,
          hiringType: true,
          positionsFilled: true,
          positionsRequired: true,
        },
      },
    },
  });

  if (
    !contract ||
    contract.status === ContractStatus.COMPLETED ||
    contract.status === ContractStatus.CANCELLED ||
    contract.status === ContractStatus.REJECTED ||
    contract.status === ContractStatus.EXPIRED
  ) {
    return false;
  }

  const milestones = await tx.milestone.findMany({
    where: {
      contractId,
      deletedAt: null,
    },
    select: {
      id: true,
      paymentStatus: true,
    },
  });

  if (milestones.length === 0) return false;

  const releasedCount = milestones.filter(
    (m) => m.paymentStatus === MilestonePaymentStatus.RELEASED,
  ).length;
  const unsettledCount = milestones.filter(
    (m) =>
      m.paymentStatus !== MilestonePaymentStatus.RELEASED &&
      m.paymentStatus !== MilestonePaymentStatus.REFUNDED,
  ).length;

  if (releasedCount === 0 || unsettledCount > 0) {
    return false;
  }

  const now = new Date();

  await tx.contract.update({
    where: { id: contractId },
    data: {
      status: ContractStatus.COMPLETED,
      completedAt: now,
      freelancerFeeStatus: PlatformFeeStatus.PAID,
      freelancerFeePaidAt: contract.freelancerFeePaidAt ?? now,
    },
  });

  let shouldCompleteJob = contract.job.hiringType === HiringType.SINGLE;
  if (!shouldCompleteJob && contract.job.hiringType === HiringType.MULTIPLE) {
    const remainingOpenContracts = await tx.contract.count({
      where: {
        jobId: contract.jobId,
        id: { not: contractId },
        deletedAt: null,
        status: {
          in: [
            ContractStatus.AWAITING_PAYMENT,
            ContractStatus.PENDING_SIGN,
            ContractStatus.ACTIVE,
            ContractStatus.DISPUTED,
          ],
        },
      },
    });
    shouldCompleteJob =
      remainingOpenContracts === 0 &&
      contract.job.positionsFilled >= contract.job.positionsRequired;
  }

  if (shouldCompleteJob && contract.job.status !== JobStatus.COMPLETED) {
    await tx.job.update({
      where: { id: contract.jobId },
      data: { status: JobStatus.COMPLETED },
    });
  }

  await tx.notification.createMany({
    data: [
      {
        userId: contract.clientId,
        type: NotificationType.MILESTONE_COMPLETED,
        title: 'Contract & Job completed',
        message: `All escrowed milestones under contract #${contract.id} ("${contract.job.title}") have been released. Both the contract and job are now Completed.`,
        data: {
          href: `/client/contracts/${contract.slug}`,
          contractId: contract.id,
          contractSlug: contract.slug,
          jobId: contract.jobId,
        },
      },
      {
        userId: contract.freelancerId,
        type: NotificationType.MILESTONE_COMPLETED,
        title: 'Contract & Job completed',
        message: `All escrowed milestones under contract #${contract.id} ("${contract.job.title}") have been released. Both the contract and job are now Completed.`,
        data: {
          href: `/freelancer/contracts/${contract.slug}`,
          contractId: contract.id,
          contractSlug: contract.slug,
          jobId: contract.jobId,
        },
      },
    ],
  });

  return true;
}
