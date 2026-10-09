import {
    ForbiddenException,
    InternalServerErrorException,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { ManageSharedFileMessage } from '@shared/types';


export const SharedFileNotFoundException = () =>
    new NotFoundException([
        {
            message: ManageSharedFileMessage.FILE_NOT_FOUND,
            path: 'id',
        },
    ]);


export const SharedFileForbiddenException = () =>
    new ForbiddenException([
        {
            message: ManageSharedFileMessage.FORBIDDEN,
            path: 'id',
        },
    ]);


export const SharedFileDeleteExpiredException = () =>
    new UnprocessableEntityException([
        {
            message: ManageSharedFileMessage.DELETE_EXPIRED,
            path: 'id',
        },
    ]);


export const SharedFileRequiredException = () =>
    new UnprocessableEntityException([
        {
            message: ManageSharedFileMessage.FILE_REQUIRED,
            path: 'file',
        },
    ]);


export const ContractNotFoundException = () =>
    new NotFoundException([
        {
            message: ManageSharedFileMessage.CONTRACT_NOT_FOUND,
            path: 'contractId',
        },
    ]);


export const FailedToUploadSharedFileException = () =>
    new InternalServerErrorException([
        {
            message: ManageSharedFileMessage.FAILED_TO_UPLOAD,
            path: '',
        },
    ]);


export const FailedToLoadSharedFilesException = () =>
    new InternalServerErrorException([
        {
            message: ManageSharedFileMessage.FAILED_TO_LOAD,
            path: '',
        },
    ]);


export const FailedToDeleteSharedFileException = () =>
    new InternalServerErrorException([
        {
            message: ManageSharedFileMessage.FAILED_TO_DELETE,
            path: '',
        },
    ]);