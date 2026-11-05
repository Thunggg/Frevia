import {
  ContractStatus,
  HiringType,
  JobStatus,
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
