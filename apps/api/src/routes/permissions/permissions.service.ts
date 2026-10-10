import { Injectable, Logger } from '@nestjs/common';
import {
  CreatePermissionBodyType,
  CreatePermissionResponseType,
  PermissionDetailResponseType,
  PermissionListResponseType,
} from '@shared/types';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  FailedToCreatePermissionException,
  FailedToLoadPermissionDetailException,
  FailedToLoadPermissionsException,
  PermissionAlreadyExistsException,
} from './permissions.error';
import { PermissionsRepository } from './permissions.repo';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly permissionsRepository: PermissionsRepository) {}

  async getPermissions(): Promise<PermissionListResponseType> {
    try {
      return await this.permissionsRepository.findAll();
    } catch (error) {
      this.logger.error('Failed to load permissions', error);
      throw FailedToLoadPermissionsException();
    }
  }

  async getPermissionById(id: number): Promise<PermissionDetailResponseType> {
    try {
      return await this.permissionsRepository.findById(id);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        this.logger.error(`Failed to load permission detail: id=${id}`, error);
        throw FailedToLoadPermissionDetailException();
      }
      throw error;
    }
  }

  async createPermission(
    body: CreatePermissionBodyType,
    createdById: number,
  ): Promise<CreatePermissionResponseType> {
    try {
      const existing = await this.permissionsRepository.findActiveByName(
        body.name as string,
      );

      if (existing) {
        throw PermissionAlreadyExistsException();
      }

      const permission = await this.permissionsRepository.createPermission(
        body,
        createdById,
      );
      this.logger.log(
        `Permission created successfully: name=${permission.name}`,
      );
      return permission;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw PermissionAlreadyExistsException();
      }
      if (error instanceof PrismaClientKnownRequestError) {
        this.logger.error('Failed to create permission', error);
        throw FailedToCreatePermissionException();
      }
      throw error;
    }
  }
}
