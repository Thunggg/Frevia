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
 * - Nếu tất cả milestone đều đã bị REFUND (không có milestone nào được giải ngân):
 *   tự động cập nhật hợp đồng sang CANCELLED.
 * - Nếu tất cả milestone đã giải ngân / xử lý xong và có ít nhất 1 milestone đã RELEASED:
 *   cập nhật trạng thái phí sàn freelancer (PAID), thông báo cho client có thể hoàn thành hợp đồng.
 *   (Hợp đồng vẫn giữ ACTIVE để Client chủ động nghiệm thu và bấm "Hoàn thành hợp đồng" / completeContract).
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

  if (unsettledCount > 0) {
    return false;
  }

  // Nếu tất cả milestone đều đã bị REFUND (không có milestone nào được giải ngân),
  // tự động cập nhật hợp đồng sang CANCELLED để tránh bế tắc vĩnh viễn ở trạng thái ACTIVE.
  if (releasedCount === 0) {
    await tx.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.CANCELLED,
      },
    });
    return false;
  }

  const now = new Date();

  // Cập nhật trạng thái thanh toán phí sàn của freelancer sang PAID
  await tx.contract.update({
    where: { id: contractId },
    data: {
      freelancerFeeStatus: PlatformFeeStatus.PAID,
      freelancerFeePaidAt: contract.freelancerFeePaidAt ?? now,
    },
  });

  // Gửi thông báo cho Client biết tất cả milestone đã giải ngân, có thể vào nghiệm thu & hoàn thành hợp đồng
  if (tx.notification?.createMany) {
    await tx.notification.createMany({
      data: [
        {
          userId: contract.clientId,
          type: NotificationType.MILESTONE_COMPLETED,
          title: 'All milestones settled',
          message: `All milestones under contract #${contract.id} ("${contract.job.title}") have been settled. You can now complete the contract and leave a review.`,
          data: {
            href: `/client/contracts/${contract.slug}`,
            contractId: contract.id,
            contractSlug: contract.slug,
            jobId: contract.jobId,
          },
        },
      ],
    });
  }

  return false;
}
