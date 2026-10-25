import { HttpException, Injectable, Logger } from '@nestjs/common';
import {
  DisputeDecisionResponse,
  DisputeEvidenceType,
  DisputeFeeStatus,
  DisputeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
} from '@prisma/client';
import {
  AdminDisputeFinalDecisionBodyType,
  CounterOfferBodyType,
  CreateDisputeBodyType,
  DEFAULT_ARBITRATION_FEE,
  FEE_DEADLINE_HOURS,
  GetDisputeListQueryType,
  MAX_DISPUTE_EVIDENCE_FILES,
  RESPONSE_DEADLINE_HOURS,
  ReviewDisputeDecisionBodyType,
  RoleName,
  SubmitDisputeResponseBodyType,
} from '@shared/types';
import {
  AdminCannotDecideException,
  CannotArbitrateOwnContractException,
  DisputeAlreadyClaimedException,
  DisputeAlreadyFinalizedException,
  DisputeDecisionNotPendingException,
  DisputeEvidenceLimitExceededException,
  DisputeFeesNotPaidException,
  DisputeForbiddenException,
  DisputeInvalidSplitAmountException,
  DisputeMilestoneNotFoundException,
  DisputeNotContractParticipantException,
  DisputeNotFoundException,
  DisputeResponseNotAllowedException,
  DisputeReviewAlreadySubmittedException,
  ExpertNotActiveException,
  ExpertNotFoundException,
  ExpertStripeNotReadyException,
  FailedToAssignExpertException,
  FailedToCreateDisputeException,
  FailedToFinalizeDisputeException,
  FailedToLoadDisputeException,
  FailedToMakeDisputeDecisionException,
  FailedToSubmitDisputeResponseException,
  FailedToSubmitDisputeReviewException,
  MilestoneAlreadyDisputedException,
  MilestoneCannotBeDisputedException,
  NegotiationPeriodExpiredException,
  NotAssignedExpertException,
  OfferNotAllowedException,
} from './dispute.error';
import { DisputeRepository } from './dispute.repo';
import { PaymentService } from '../payments/payment.service';

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(
    private readonly disputeRepo: DisputeRepository,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Helper kiểm tra quyền truy cập Dispute.
   */
  private canAccessDispute(
    userId: number,
    roleName: string,
    dispute: {
      openedById: number;
      respondentId: number;
      decisionById: number | null;
      status: DisputeStatus;
    },
  ): boolean {
    const normalizedRole = roleName?.toUpperCase();
    if (normalizedRole === RoleName.ADMIN) return true;
    if (dispute.openedById === userId || dispute.respondentId === userId)
      return true;
    if (dispute.decisionById === userId) return true;
    if (
      normalizedRole === RoleName.EXPERT &&
      dispute.status === DisputeStatus.REVIEW_REQUESTED
    ) {
      return true;
    }
    return false;
  }

  /**
   * 1. Tạo Dispute mới: Mở thương lượng 2 bên trong 2 ngày (48h) - MIỄN PHÍ.
   */
  async createDispute(userId: number, body: CreateDisputeBodyType) {
    try {
      const milestone = await this.disputeRepo.findMilestoneWithContract(
        body.milestoneId,
      );
      if (!milestone) {
        throw DisputeMilestoneNotFoundException();
      }

      const contract = milestone.contract;
      const isParticipant =
        contract.clientId === userId || contract.freelancerId === userId;
      if (!isParticipant) {
        throw DisputeNotContractParticipantException();
      }

      if (milestone.dispute) {
        throw MilestoneAlreadyDisputedException();
      }

      if (
        milestone.paymentStatus !== MilestonePaymentStatus.FUNDED ||
        milestone.status === MilestoneStatus.COMPLETED
      ) {
        throw MilestoneCannotBeDisputedException();
      }

      const milestoneAmount = Number(milestone.amount);

      // Xác định đề xuất ban đầu
      let freelancerAmount: number;
      let clientAmount: number;

      if (
        body.freelancerAmount !== undefined &&
        body.clientAmount !== undefined
      ) {
        const sum = Number(
          (body.freelancerAmount + body.clientAmount).toFixed(2),
        );
        if (sum !== Number(milestoneAmount.toFixed(2))) {
          throw DisputeInvalidSplitAmountException();
        }
        freelancerAmount = body.freelancerAmount;
        clientAmount = body.clientAmount;
      } else {
        // Mặc định: nếu Client mở -> yêu cầu hoàn 100%; nếu Freelancer mở -> yêu cầu nhận 100%
        if (userId === contract.clientId) {
          clientAmount = milestoneAmount;
          freelancerAmount = 0;
        } else {
          clientAmount = 0;
          freelancerAmount = milestoneAmount;
        }
      }

      const respondentId =
        userId === contract.clientId
          ? contract.freelancerId
          : contract.clientId;

      // Hạn thương lượng: đúng 48 giờ (2 ngày)
      const responseDeadline = new Date(
        Date.now() + RESPONSE_DEADLINE_HOURS * 60 * 60 * 1000,
      );
      const feeDeadline = new Date(
        Date.now() +
          (RESPONSE_DEADLINE_HOURS + FEE_DEADLINE_HOURS) * 60 * 60 * 1000,
      );

      return await this.disputeRepo.createDisputeTransaction({
        milestoneId: body.milestoneId,
        openedById: userId,
        respondentId,
        reason: body.reason,
        description: body.description,
        arbitrationFee: DEFAULT_ARBITRATION_FEE,
        feeDeadline,
        responseDeadline,
        freelancerAmount,
        clientAmount,
        evidenceFiles: body.evidenceFiles,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to create dispute', error);
      throw FailedToCreateDisputeException();
    }
  }

  /**
   * 2. Bổ sung bằng chứng: 2 bên có thể gửi bao nhiêu bằng chứng cũng được trong 48h, không được xóa.
   */
  async addEvidence(
    userId: number,
    disputeId: number,
    body: SubmitDisputeResponseBodyType,
  ) {
    try {
      const dispute = await this.disputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      const isParticipant =
        dispute.openedById === userId || dispute.respondentId === userId;
      if (!isParticipant) {
        throw DisputeForbiddenException();
      }

      if (
        dispute.status !== DisputeStatus.OPEN &&
        dispute.status !== DisputeStatus.WAITING_RESPONSE
      ) {
        throw DisputeResponseNotAllowedException();
      }

      // Kiểm tra còn trong thời hạn 48 giờ không
      if (dispute.responseDeadline && new Date() > dispute.responseDeadline) {
        throw NegotiationPeriodExpiredException();
      }

      if (
        body.evidenceFiles &&
        body.evidenceFiles.length > MAX_DISPUTE_EVIDENCE_FILES
      ) {
        throw DisputeEvidenceLimitExceededException();
      }

      if (body.evidenceFiles && body.evidenceFiles.length > 0) {
        const fileIds = body.evidenceFiles
          .map((f) => f.fileId)
          .filter((id): id is number => typeof id === 'number');

        if (fileIds.length > 0) {
          const files = await this.disputeRepo.findSharedFilesByIds(
            fileIds,
            dispute.milestone.contract.id,
          );
          if (files.length !== fileIds.length) {
            throw DisputeForbiddenException();
          }
        }
      }

      const evidenceType =
        userId === dispute.openedById
          ? DisputeEvidenceType.CLAIM
          : DisputeEvidenceType.RESPONSE;

      return await this.disputeRepo.addEvidenceTransaction(
        disputeId,
        userId,
        evidenceType,
        body.description,
        body.evidenceFiles,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to add dispute evidence', error);
      throw FailedToSubmitDisputeResponseException();
    }
  }

  /**
   * Alias cho backward-compatibility với route submitResponse cũ.
   */
  async submitResponse(
    userId: number,
    disputeId: number,
    body: SubmitDisputeResponseBodyType,
  ) {
    return this.addEvidence(userId, disputeId, body);
  }

  /**
   * 3. Đưa ra đề xuất phân chia mới (Counter-offer) trong 48h thương lượng.
   */
  async submitCounterOffer(
    userId: number,
    disputeId: number,
    body: CounterOfferBodyType,
  ) {
    try {
      const dispute = await this.disputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      const isParticipant =
        dispute.openedById === userId || dispute.respondentId === userId;
      if (!isParticipant) {
        throw DisputeForbiddenException();
      }

      if (
        dispute.status !== DisputeStatus.OPEN &&
        dispute.status !== DisputeStatus.WAITING_RESPONSE
      ) {
        throw OfferNotAllowedException();
      }

      if (dispute.responseDeadline && new Date() > dispute.responseDeadline) {
        throw NegotiationPeriodExpiredException();
      }

      const milestoneAmount = Number(dispute.milestone.amount);
      const sum = Number(
        (body.freelancerAmount + body.clientAmount).toFixed(2),
      );
      if (sum !== Number(milestoneAmount.toFixed(2))) {
        throw DisputeInvalidSplitAmountException();
      }

      const otherUserId =
        userId === dispute.openedById
          ? dispute.respondentId
          : dispute.openedById;

      return await this.disputeRepo.counterOfferTransaction({
        disputeId,
        userId,
        otherUserId,
        freelancerAmount: body.freelancerAmount,
        clientAmount: body.clientAmount,
        reason: body.reason,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to submit counter offer', error);
      throw FailedToMakeDisputeDecisionException();
    }
  }

  /**
   * 4. Chấp nhận đề xuất phân chia hiện tại -> Tự động Hoàn tất (FINALIZED) MIỄN PHÍ.
   */
  async acceptOffer(userId: number, disputeId: number) {
    try {
      const dispute = await this.disputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      const isParticipant =
        dispute.openedById === userId || dispute.respondentId === userId;
      if (!isParticipant) {
        throw DisputeForbiddenException();
      }

      if (
        dispute.status !== DisputeStatus.OPEN &&
        dispute.status !== DisputeStatus.WAITING_RESPONSE
      ) {
        throw DisputeDecisionNotPendingException();
      }

      if (dispute.responseDeadline && new Date() > dispute.responseDeadline) {
        throw NegotiationPeriodExpiredException();
      }

      // Người đã đưa đề xuất (đã ACCEPT) không thể tự accept lại đề xuất của chính mình
      const myReview = dispute.decisionReviews.find((r) => r.userId === userId);
      if (myReview && myReview.response === DisputeDecisionResponse.ACCEPTED) {
        throw DisputeReviewAlreadySubmittedException();
      }

      // Đánh dấu user này đồng ý
      await this.disputeRepo.upsertDecisionReview(
        disputeId,
        userId,
        DisputeDecisionResponse.ACCEPTED,
        'Accepted settlement proposal during direct negotiation',
      );

      // Cả 2 bên đã đồng ý -> Giải ngân theo thỏa thuận (MIỄN PHÍ, không mất phí trọng tài)
      return await this.executeFinalization(
        dispute,
        Number(dispute.freelancerAmount),
        Number(dispute.clientAmount),
        dispute.decisionReason ?? 'Mutual agreement reached by both parties',
        userId,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to accept offer', error);
      throw FailedToSubmitDisputeReviewException();
    }
  }

  /**
   * 5. Từ chối hoặc chấp thuận (Hỗ trợ review decision và chuyển sang giai đoạn Trọng tài).
   */
  async submitDecisionReview(
    userId: number,
    disputeId: number,
    body: ReviewDisputeDecisionBodyType,
  ) {
    if (body.response === 'ACCEPTED') {
      return this.acceptOffer(userId, disputeId);
    }

    // Nếu REJECTED -> Leo thang lên Trọng tài Chuyên gia, tạo 2 khoản phí $200
    try {
      const dispute = await this.disputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      const isParticipant =
        dispute.openedById === userId || dispute.respondentId === userId;
      if (!isParticipant) {
        throw DisputeForbiddenException();
      }

      if (
        dispute.status === DisputeStatus.FINALIZED ||
        dispute.status === DisputeStatus.CANCELLED
      ) {
        throw DisputeAlreadyFinalizedException();
      }

      if (
        dispute.status !== DisputeStatus.OPEN &&
        dispute.status !== DisputeStatus.WAITING_RESPONSE
      ) {
        throw DisputeDecisionNotPendingException();
      }

      await this.disputeRepo.upsertDecisionReview(
        disputeId,
        userId,
        DisputeDecisionResponse.REJECTED,
        body.reason,
      );

      const feeDeadline = new Date(
        Date.now() + FEE_DEADLINE_HOURS * 60 * 60 * 1000,
      );
      const contract = dispute.milestone.contract;

      return await this.disputeRepo.escalateToArbitrationTransaction(
        disputeId,
        DEFAULT_ARBITRATION_FEE,
        feeDeadline,
        contract.clientId,
        contract.freelancerId,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to submit dispute review', error);
      throw FailedToSubmitDisputeReviewException();
    }
  }

  /**
   * 6. Nộp phí trọng tài ($200) qua Stripe Checkout khi leo thang.
   */
  async payFee(userId: number, disputeId: number) {
    return this.paymentService.createDisputeFeeCheckoutSession(
      userId,
      disputeId,
    );
  }

  /**
   * 7. Xem chi tiết Dispute (Clean, Không ghi DB trong GET, map virtual OVERDUE).
   */
  async getDisputeDetail(userId: number, roleName: string, disputeId: number) {
    try {
      const dispute = await this.disputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      if (!this.canAccessDispute(userId, roleName, dispute)) {
        throw DisputeForbiddenException();
      }

      // Virtual status cho fee quá hạn mà chưa trả, KHÔNG ghi DB
      const now = new Date();
      dispute.fees = dispute.fees.map((fee) => ({
        ...fee,
        status:
          fee.status === DisputeFeeStatus.PENDING &&
          fee.deadline &&
          now > fee.deadline
            ? DisputeFeeStatus.OVERDUE
            : fee.status,
      }));

      return dispute;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to load dispute detail', error);
      throw FailedToLoadDisputeException();
    }
  }

  /**
   * 8. Xem chi tiết Dispute theo Milestone ID (Tái sử dụng getDisputeDetail).
   */
  async getDisputeByMilestoneId(
    userId: number,
    roleName: string,
    milestoneId: number,
  ) {
    try {
      const dispute =
        await this.disputeRepo.findDisputeByMilestoneId(milestoneId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      return this.getDisputeDetail(userId, roleName, dispute.id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to load dispute by milestoneId', error);
      throw FailedToLoadDisputeException();
    }
  }

  /**
   * 9. Danh sách Dispute của User (Freelancer / Client).
   */
  async listMyDisputes(userId: number, query: GetDisputeListQueryType) {
    try {
      return await this.disputeRepo.listDisputes(query, userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to list user disputes', error);
      throw FailedToLoadDisputeException();
    }
  }

  /**
   * 10. Admin: Danh sách Dispute trên dashboard (Chỉ xem).
   */
  async adminListDisputes(roleName: string, query: GetDisputeListQueryType) {
    try {
      if (roleName?.toUpperCase() !== RoleName.ADMIN) {
        throw DisputeForbiddenException();
      }

      return await this.disputeRepo.listDisputes(query);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to list disputes for admin', error);
      throw FailedToLoadDisputeException();
    }
  }

  /**
   * 11. Admin: Lấy danh sách Expert có chuyên môn phù hợp với Job để Admin lựa chọn.
   */
  async adminGetMatchingExperts(roleName: string, disputeId: number) {
    try {
      if (roleName?.toUpperCase() !== RoleName.ADMIN) {
        throw DisputeForbiddenException();
      }

      const dispute = await this.disputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      const contract = dispute.milestone.contract;
      const job = contract.job;

      const activeExperts = await this.disputeRepo.findAllActiveExperts();

      // Từ khóa chuyên môn từ Job
      const terms: string[] = [];
      if (job) {
        job.jobCategories.forEach((jc) => {
          terms.push(jc.category.name.toLowerCase());
          terms.push(jc.category.slug.toLowerCase());
        });
        job.skills.forEach((js) => {
          terms.push(js.skill.name.toLowerCase());
          terms.push(js.skill.slug.toLowerCase());
        });
      }

      // Lọc các Expert không tham gia hợp đồng và có chuyên môn khớp
      const matching = activeExperts
        .filter(
          (u) => u.id !== contract.clientId && u.id !== contract.freelancerId,
        )
        .filter((u) => {
          const expProfile = u.profile?.expertProfile;
          const expertise = expProfile?.expertise ?? [];
          const normalizedExpertise = expertise.map((e) =>
            e.trim().toLowerCase(),
          );

          return (
            terms.length === 0 ||
            normalizedExpertise.length === 0 ||
            normalizedExpertise.some((exp) =>
              terms.some((term) => term.includes(exp) || exp.includes(term)),
            )
          );
        })
        .map((u) => {
          const expProfile = u.profile?.expertProfile;
          return {
            userId: u.id,
            email: u.email,
            title: expProfile?.title ?? null,
            expertise: expProfile?.expertise ?? [],
            yearsOfExperience: expProfile?.yearsOfExperience ?? 0,
            stripeReady: Boolean(
              u.stripeAccountId && u.stripeOnboardingCompleted,
            ),
          };
        });

      return { data: matching };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to get matching experts', error);
      throw FailedToLoadDisputeException();
    }
  }

  /**
   * 12. Admin: Cử Expert xử lý vụ tranh chấp (Yêu cầu cả 2 bên đã nộp đủ $400 phí).
   */
  async adminAssignExpert(
    roleName: string,
    disputeId: number,
    expertId: number,
  ) {
    try {
      if (roleName?.toUpperCase() !== RoleName.ADMIN) {
        throw DisputeForbiddenException();
      }

      const dispute = await this.disputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      if (
        dispute.status === DisputeStatus.FINALIZED ||
        dispute.status === DisputeStatus.CANCELLED
      ) {
        throw DisputeAlreadyFinalizedException();
      }

      // Kiểm tra CẢ HAI BÊN đã nộp đủ phí chưa ($200/người = $400)
      const paidFees = dispute.fees.filter(
        (f) => f.status === DisputeFeeStatus.PAID,
      );
      if (dispute.fees.length < 2 || paidFees.length < 2) {
        throw DisputeFeesNotPaidException();
      }

      // Kiểm tra thông tin Expert
      const expertUser =
        await this.disputeRepo.findUserWithProfileAndRoles(expertId);
      if (!expertUser) {
        throw ExpertNotFoundException();
      }

      const expertProfile = expertUser.profile?.expertProfile;
      if (!expertProfile || !expertProfile.isActive) {
        throw ExpertNotActiveException();
      }

      if (
        !expertUser.stripeAccountId ||
        !expertUser.stripeOnboardingCompleted
      ) {
        throw ExpertStripeNotReadyException();
      }

      const contract = dispute.milestone.contract;
      if (
        contract.clientId === expertId ||
        contract.freelancerId === expertId
      ) {
        throw CannotArbitrateOwnContractException();
      }

      return await this.disputeRepo.assignExpert(disputeId, expertId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to assign expert to dispute', error);
      throw FailedToAssignExpertException();
    }
  }

  /**
   * Admin không có quyền tự phán quyết chia tiền (Quyền phán quyết hoàn toàn thuộc về Expert).
   */
  adminMakeDecision(): never {
    throw AdminCannotDecideException();
  }

  adminFinalDecision(): never {
    throw AdminCannotDecideException();
  }

  /**
   * 13. Expert: Danh sách tranh chấp được phân công hoặc đang chờ xử lý.
   */
  async expertListDisputes(
    expertUserId: number,
    roleName: string,
    query: GetDisputeListQueryType,
  ) {
    try {
      const user =
        await this.disputeRepo.findUserWithProfileAndRoles(expertUserId);
      const isExpert =
        roleName === RoleName.EXPERT ||
        user?.userRoles.some(
          (r) => r.role.name.toLowerCase() === RoleName.EXPERT.toLowerCase(),
        );

      if (!isExpert) {
        throw DisputeForbiddenException();
      }

      const expertProfile = user?.profile?.expertProfile;
      if (!expertProfile || !expertProfile.isActive) {
        throw ExpertNotActiveException();
      }

      return await this.disputeRepo.listDisputesForExpert(
        query,
        expertProfile.expertise,
        expertUserId,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to list disputes for expert', error);
      throw FailedToLoadDisputeException();
    }
  }

  /**
   * 14. Expert: Claim dispute (nếu tự nhận hoặc được phân công).
   */
  async expertClaimDispute(
    expertUserId: number,
    roleName: string,
    disputeId: number,
  ) {
    try {
      const user =
        await this.disputeRepo.findUserWithProfileAndRoles(expertUserId);
      const isExpert =
        roleName?.toUpperCase() === RoleName.EXPERT ||
        user?.userRoles.some(
          (r) => r.role.name.toUpperCase() === RoleName.EXPERT,
        );

      if (!isExpert) {
        throw DisputeForbiddenException();
      }

      const expertProfile = user?.profile?.expertProfile;
      if (!expertProfile || !expertProfile.isActive) {
        throw ExpertNotActiveException();
      }

      if (!user.stripeAccountId || !user.stripeOnboardingCompleted) {
        throw ExpertStripeNotReadyException();
      }

      const dispute = await this.disputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      if (
        dispute.status !== DisputeStatus.REVIEW_REQUESTED &&
        dispute.status !== DisputeStatus.UNDER_REVIEW
      ) {
        throw DisputeDecisionNotPendingException();
      }

      const contract = dispute.milestone.contract;
      if (
        contract.clientId === expertUserId ||
        contract.freelancerId === expertUserId
      ) {
        throw CannotArbitrateOwnContractException();
      }

      if (dispute.decisionById && dispute.decisionById !== expertUserId) {
        throw DisputeAlreadyClaimedException();
      }

      const paidFees = dispute.fees.filter(
        (f) => f.status === DisputeFeeStatus.PAID,
      );
      if (dispute.fees.length < 2 || paidFees.length < 2) {
        throw DisputeFeesNotPaidException();
      }

      await this.disputeRepo.claimDispute(disputeId, expertUserId);

      return {
        success: true,
        disputeId,
        expertId: expertUserId,
        message: 'Successfully claimed dispute for arbitration',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to claim dispute', error);
      throw FailedToAssignExpertException();
    }
  }

  /**
   * 15. Expert: Đưa ra phán quyết chung thẩm duy nhất (Final Decision - Binding).
   * Phân chia tiền Milestone cho 2 bên + chuyển toàn bộ $400 phí trọng tài cho Expert.
   */
  async expertFinalDecision(
    expertUserId: number,
    roleName: string,
    disputeId: number,
    body: AdminDisputeFinalDecisionBodyType,
  ) {
    try {
      const normalizedRole = roleName?.toUpperCase();
      if (
        normalizedRole !== RoleName.EXPERT &&
        normalizedRole !== RoleName.ADMIN
      ) {
        throw DisputeForbiddenException();
      }

      const dispute = await this.disputeRepo.findDisputeById(disputeId);
      if (!dispute) {
        throw DisputeNotFoundException();
      }

      // Chỉ Expert được phân công mới có quyền ra phán quyết
      const isAssignedExpert = dispute.decisionById === expertUserId;
      if (!isAssignedExpert) {
        throw NotAssignedExpertException();
      }

      if (
        dispute.status === DisputeStatus.FINALIZED ||
        dispute.status === DisputeStatus.CANCELLED
      ) {
        throw DisputeAlreadyFinalizedException();
      }

      if (
        dispute.status !== DisputeStatus.UNDER_REVIEW &&
        dispute.status !== DisputeStatus.REVIEW_REQUESTED
      ) {
        throw DisputeDecisionNotPendingException();
      }

      const paidFees = dispute.fees.filter(
        (f) => f.status === DisputeFeeStatus.PAID,
      );
      if (dispute.fees.length < 2 || paidFees.length < 2) {
        throw DisputeFeesNotPaidException();
      }

      const milestoneAmount = Number(dispute.milestone.amount);
      const totalDecided = Number(
        (body.freelancerAmount + body.clientAmount).toFixed(2),
      );
      if (totalDecided !== Number(milestoneAmount.toFixed(2))) {
        throw DisputeInvalidSplitAmountException();
      }

      return await this.executeFinalization(
        dispute,
        body.freelancerAmount,
        body.clientAmount,
        body.decisionReason,
        expertUserId,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        'Failed to make final dispute decision by expert',
        error,
      );
      throw FailedToFinalizeDisputeException();
    }
  }

  /**
   * Thực hiện phân phối số tiền giải quyết an toàn, idempotent và hoàn tất dispute.
   */
  private async executeFinalization(
    dispute: NonNullable<
      Awaited<ReturnType<DisputeRepository['findDisputeById']>>
    >,
    freelancerAmount: number,
    clientAmount: number,
    decisionReason: string,
    finalResolverId?: number,
  ) {
    const milestoneAmount = Number(dispute.milestone.amount);

    // 1. Trạng thái Milestone sau khi hòa giải
    let milestonePaymentStatus: MilestonePaymentStatus =
      MilestonePaymentStatus.RELEASED;
    if (clientAmount === milestoneAmount) {
      milestonePaymentStatus = MilestonePaymentStatus.REFUNDED;
    }

    // 2. Xác định bên thắng
    let winningParty: 'CLIENT' | 'FREELANCER' | 'SPLIT' = 'SPLIT';
    if (clientAmount > freelancerAmount) {
      winningParty = 'CLIENT';
    } else if (freelancerAmount > clientAmount) {
      winningParty = 'FREELANCER';
    }

    // 3. Thực thi chuyển tiền / hoàn tiền trên Stripe (Escrow + Arbitration Fee cho Expert)
    try {
      await this.paymentService.settleDispute(
        finalResolverId ?? dispute.decisionById ?? dispute.openedById,
        RoleName.ADMIN,
        dispute.id,
        {
          clientAmount,
          freelancerAmount,
          winningParty,
          decisionReason,
        },
      );
    } catch (settleError) {
      this.logger.error(
        `Stripe settlement encountered an issue for dispute ${dispute.id}:`,
        settleError,
      );
    }

    // 4. Cập nhật Dispute và Milestone trong Transaction
    return await this.disputeRepo.finalizeDisputeTransaction({
      disputeId: dispute.id,
      milestoneId: dispute.milestoneId,
      adminId: finalResolverId ?? dispute.decisionById ?? undefined,
      freelancerAmount,
      clientAmount,
      decisionReason,
      finalDecisionAt: new Date(),
      milestoneStatus: MilestoneStatus.COMPLETED,
      milestonePaymentStatus,
    });
  }
}
