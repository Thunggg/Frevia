import {
    HttpException,
    Injectable,
} from '@nestjs/common';
import { RoleName } from '@shared/types';
import { SharedFileRepository } from './shared-file.repo';
import {
    ContractNotFoundException,
    FailedToDeleteSharedFileException,
    FailedToLoadSharedFilesException,
    FailedToUploadSharedFileException,
    SharedFileDeleteExpiredException,
    SharedFileForbiddenException,
    SharedFileNotFoundException,
    SharedFileRequiredException,
} from './shared-file.error';
import { CloudinaryService } from '../../shared/services/cloudinary.service';

@Injectable()
export class SharedFileService {
    constructor(
        private readonly sharedFileRepository: SharedFileRepository,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    async getSharedFiles(userId: number, roleName: string, contractId: number) {
        try {
            const contract = await this.sharedFileRepository.findContractById(contractId);
            if (!contract) {
                throw ContractNotFoundException();
            }

            const isParticipant =
                contract.clientId === userId ||
                contract.freelancerId === userId ||
                roleName === RoleName.ADMIN;

            if (!isParticipant) {
                throw SharedFileForbiddenException();
            }

            return await this.sharedFileRepository.findByContractId(contractId);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            throw FailedToLoadSharedFilesException();
        }
    }

    async uploadSharedFile(
        userId: number,
        roleName: string,
        contractId: number,
        file: Express.Multer.File,
    ) {
        try {

            const contract = await this.sharedFileRepository.findContractById(contractId);
            if (!contract) {
                throw ContractNotFoundException();
            }

            const isParticipant =
                contract.clientId === userId ||
                contract.freelancerId === userId ||
                roleName === RoleName.ADMIN;

            if (!isParticipant) {
                throw SharedFileForbiddenException();
            }

            const cloudinaryResult = await this.cloudinaryService.uploadFile(
                file,
                `frevia/contracts/${contractId}`,
            );

            return await this.sharedFileRepository.create({
                contractId,
                uploaderId: userId,
                fileUrl: cloudinaryResult.secure_url,
                publicId: cloudinaryResult.public_id,
                fileName: file.originalname,
            });
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            throw FailedToUploadSharedFileException();
        }
    }

    async deleteSharedFile(
        userId: number,
        roleName: string,
        contractId: number,
        fileId: number,
    ) {
        try {
            const contract = await this.sharedFileRepository.findContractById(contractId);
            if (!contract) {
                throw ContractNotFoundException();
            }

            const file = await this.sharedFileRepository.findById(fileId);
            if (!file || file.contractId !== contractId || file.deletedAt) {
                throw SharedFileNotFoundException();
            }

            const isUploader = file.uploaderId === userId;
            const isAdmin = roleName === RoleName.ADMIN;

            if (!isUploader && !isAdmin) {
                throw SharedFileForbiddenException();
            }

            const ONE_HOUR_MS = 60 * 60 * 1000;
            const isExpired = Date.now() - file.createdAt.getTime() > ONE_HOUR_MS;

            if (isExpired && !isAdmin) {
                throw SharedFileDeleteExpiredException();
            }

            if (file.publicId) {
                await this.cloudinaryService.deleteFile(file.publicId);
            }

            return await this.sharedFileRepository.softDelete(fileId);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            throw FailedToDeleteSharedFileException();
        }
    }
}