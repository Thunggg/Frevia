import { HttpException, Injectable } from '@nestjs/common';
import { RoleName } from '@shared/types';
import { CloudinaryService } from '../../shared/services/cloudinary.service';
import { MilestoneFileRepository } from './milestone-file.repo';
import {
    FailedToDeleteMilestoneFileException,
    FailedToLoadMilestoneFilesException,
    FailedToUploadMilestoneFileException,
    MilestoneFileContractNotFoundException,
    MilestoneFileForbiddenException,
    MilestoneFileMilestoneNotFoundException,
    MilestoneFileNotFoundException,
    MilestoneFileRequiredException,
} from './milestone-file.error';

@Injectable()
export class MilestoneFileService {
    constructor(
        private readonly milestoneFileRepository: MilestoneFileRepository,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    async getMilestoneFiles(userId: number, roleName: string, contractId: number, milestoneId: number) {
        try {
            const contract = await this.milestoneFileRepository.findContractById(contractId);
            if (!contract) throw MilestoneFileContractNotFoundException();

            const isParticipant =
                contract.clientId === userId ||
                contract.freelancerId === userId ||
                roleName === RoleName.ADMIN;

            if (!isParticipant) throw MilestoneFileForbiddenException();

            const milestone = await this.milestoneFileRepository.findMilestoneById(milestoneId);
            if (!milestone) throw MilestoneFileMilestoneNotFoundException();

            if (milestone.contractId !== contractId) throw MilestoneFileForbiddenException();

            return await this.milestoneFileRepository.getMilestoneFiles(milestoneId);
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw FailedToLoadMilestoneFilesException();
        }
    }

    async uploadMilestoneFile(
        userId: number,
        contractId: number,
        milestoneId: number,
        file: Express.Multer.File,
    ) {
        try {
            if (!file) {
                throw MilestoneFileRequiredException();
            }
            const contract = await this.milestoneFileRepository.findContractById(contractId);
            if (!contract) throw MilestoneFileContractNotFoundException();

            const isParticipant =
                contract.clientId === userId ||
                contract.freelancerId === userId;

            if (!isParticipant) throw MilestoneFileForbiddenException();

            const milestone = await this.milestoneFileRepository.findMilestoneById(milestoneId);
            if (!milestone) throw MilestoneFileMilestoneNotFoundException();

            if (milestone.contractId !== contractId) throw MilestoneFileForbiddenException();

            const cloudinaryResult = await this.cloudinaryService.uploadFile(
                file,
                `frevia/milestones/${milestoneId}`,
            );
            try {
                return await this.milestoneFileRepository.createMilestoneFile({
                    milestoneId,
                    uploaderId: userId,
                    fileUrl: cloudinaryResult.secure_url,
                    publicId: cloudinaryResult.public_id,
                    fileName: file.originalname,
                });
            } catch (error) {
                await this.cloudinaryService.deleteFile(
                    cloudinaryResult.public_id,
                );

                throw error;
            }
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw FailedToUploadMilestoneFileException();
        }
    }

    async deleteMilestoneFile(
        userId: number,
        contractId: number,
        milestoneId: number,
        fileId: number,
    ) {
        try {
            const contract = await this.milestoneFileRepository.findContractById(contractId);
            if (!contract) throw MilestoneFileContractNotFoundException();

            const isParticipant =
                contract.clientId === userId ||
                contract.freelancerId === userId;

            if (!isParticipant) {
                throw MilestoneFileForbiddenException();
            }

            const milestone = await this.milestoneFileRepository.findMilestoneById(milestoneId);
            if (!milestone) throw MilestoneFileMilestoneNotFoundException();

            if (milestone.contractId !== contractId) throw MilestoneFileForbiddenException();

            const file = await this.milestoneFileRepository.findFileById(fileId);
            if (!file || file.milestoneId !== milestoneId || file.deletedAt) {
                throw MilestoneFileNotFoundException();
            }

            if (file.uploaderId !== userId) {
                throw MilestoneFileForbiddenException();
            }

            if (file.publicId) {
                await this.cloudinaryService.deleteFile(file.publicId);
            }

            return await this.milestoneFileRepository.softDeleteFile(fileId);
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw FailedToDeleteMilestoneFileException();
        }
    }
}
