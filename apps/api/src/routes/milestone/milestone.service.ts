import { HttpException, Injectable } from '@nestjs/common';
import { CreateMilestoneBodyType, GetMilestoneListQueryType, UpdateMilestoneBodyType } from '@shared/types';
import { MilestoneRepository } from './milestone.repo';
import {
    FailedToCreateMilestoneException,
    FailedToDeleteMilestoneException,
    FailedToLoadMilestoneException,
    FailedToUpdateMilestoneException,
    MilestoneAmountExceedsContractException,
    MilestoneCannotBeDeletedException,
    MilestoneCannotBeEditedException,
    MilestoneContractNotFoundException,
    MilestoneContractNotActiveException,
    MilestoneForbiddenException,
    MilestoneNotFoundException,
    FailedToProgressMilestoneException,
    MilestonePaymentStatusException,
    MilestoneAlreadyInProgressException,
} from './milestone.error';
import { RoleName } from '@shared/types';
import { ContractStatus, MilestonePaymentStatus, MilestoneStatus } from '@prisma/client';

const NON_EDITABLE_STATUSES = ['APPROVED', 'CANCELLED'];
const NON_DELETABLE_STATUSES = ['APPROVED', 'SUBMITTED'];

@Injectable()
export class MilestoneService {
    constructor(private readonly milestoneRepository: MilestoneRepository) { }

    async getMilestoneList(userId: number, roleName: string, contractId: number, query: GetMilestoneListQueryType) {
        try {
            const contract = await this.milestoneRepository.findContractById(contractId);

            if (!contract) throw MilestoneContractNotFoundException();

            const isParticipant =
                contract.clientId === userId ||
                contract.freelancerId === userId ||
                roleName === RoleName.ADMIN;

            if (!isParticipant) throw MilestoneForbiddenException();

            return await this.milestoneRepository.getMilestoneList(contractId, query);
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw FailedToLoadMilestoneException();
        }
    }


    async getMilestoneDetail(userId: number, roleName: string, contractId: number, milestoneId: number) {
        try {
            const contract = await this.milestoneRepository.findContractById(contractId);

            if (!contract) throw MilestoneContractNotFoundException();

            const isParticipant =
                contract.clientId === userId ||
                contract.freelancerId === userId ||
                roleName === RoleName.ADMIN;

            if (!isParticipant) throw MilestoneForbiddenException();

            const milestone = await this.milestoneRepository.getMilestoneDetail(milestoneId);
            if (!milestone) throw MilestoneNotFoundException();

            if (milestone.contractId !== contractId) throw MilestoneForbiddenException();

            return milestone;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw FailedToLoadMilestoneException();
        }
    }


    async createMilestone(clientId: number, contractId: number, body: CreateMilestoneBodyType) {
        try {
            const contract = await this.milestoneRepository.findContractById(contractId);

            if (!contract) throw MilestoneContractNotFoundException();

            if (contract.clientId !== clientId) throw MilestoneForbiddenException();

            if (contract.status !== ContractStatus.ACTIVE) throw MilestoneContractNotActiveException();

            const totalMilestoneAmount = await this.milestoneRepository.getTotalMilestoneAmount(contractId);
            if (totalMilestoneAmount + body.amount > Number(contract.totalAmount)) {
                throw MilestoneAmountExceedsContractException();
            }

            return await this.milestoneRepository.createMilestone(contractId, body);
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw FailedToCreateMilestoneException();
        }
    }

    async updateMilestone(clientId: number, contractId: number, milestoneId: number, body: UpdateMilestoneBodyType) {
        try {
            const contract = await this.milestoneRepository.findContractById(contractId);

            if (!contract) throw MilestoneContractNotFoundException();
            if (contract.clientId !== clientId) throw MilestoneForbiddenException();

            const milestone = await this.milestoneRepository.findMilestoneById(milestoneId);
            if (!milestone) throw MilestoneNotFoundException();
            if (milestone.contractId !== contractId) throw MilestoneForbiddenException();

            if (NON_EDITABLE_STATUSES.includes(milestone.status)) {
                throw MilestoneCannotBeEditedException();
            }

            if (body.amount !== undefined) {
                const totalMilestoneAmount = await this.milestoneRepository.getTotalMilestoneAmount(contractId, milestoneId);
                if (totalMilestoneAmount + body.amount > Number(contract.totalAmount)) {
                    throw MilestoneAmountExceedsContractException();
                }
            }

            return await this.milestoneRepository.updateMilestone(milestoneId, body);
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw FailedToUpdateMilestoneException();
        }
    }


    async deleteMilestone(clientId: number, contractId: number, milestoneId: number) {
        try {
            const contract = await this.milestoneRepository.findContractById(contractId);

            if (!contract) throw MilestoneContractNotFoundException();
            if (contract.clientId !== clientId) throw MilestoneForbiddenException();

            const milestone = await this.milestoneRepository.findMilestoneById(milestoneId);
            if (!milestone) throw MilestoneNotFoundException();
            if (milestone.contractId !== contractId) throw MilestoneForbiddenException();

            if (NON_DELETABLE_STATUSES.includes(milestone.status)) {
                throw MilestoneCannotBeDeletedException();
            }

            return await this.milestoneRepository.deleteMilestone(milestoneId);
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw FailedToDeleteMilestoneException();
        }
    }

    async progressMilestone(
        userId: number,
        contractId: number,
        milestoneId: number,
    ) {
        try {
            const contract =
                await this.milestoneRepository.findContractById(contractId);

            if (!contract) throw MilestoneContractNotFoundException();

            if (contract.freelancerId !== userId) {
                throw MilestoneForbiddenException();
            }

            const milestone =
                await this.milestoneRepository.findMilestoneById(milestoneId);

            if (!milestone) throw MilestoneNotFoundException();

            if (milestone.contractId !== contractId) {
                throw MilestoneForbiddenException();
            }

            if (milestone.status !== MilestoneStatus.PENDING) {
                throw MilestoneAlreadyInProgressException();
            }


            if (milestone.paymentStatus !== MilestonePaymentStatus.FUNDED) {
                throw MilestonePaymentStatusException();
            }

            const inProgressMilestone =
                await this.milestoneRepository.findInProgressMilestone(
                    contractId,
                );

            if (
                inProgressMilestone &&
                inProgressMilestone.id !== milestoneId
            ) {
                throw MilestoneAlreadyInProgressException();
            }

            return await this.milestoneRepository.progressMilestone(milestoneId);
        } catch (error) {
            if (error instanceof HttpException) throw error;

            throw FailedToProgressMilestoneException();
        }
    }
}
