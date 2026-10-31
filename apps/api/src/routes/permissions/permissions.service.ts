import { Injectable, Logger } from '@nestjs/common';
import {
  PermissionDetailResponseType,
  PermissionFilterType,
  PermissionListResponseType,
} from '@shared/types';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  FailedToLoadPermissionDetailException,
  FailedToLoadPermissionsException,
} from './permissions.error';
import { PermissionsRepository } from './permissions.repo';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly permissionsRepository: PermissionsRepository) {}

  async getPermissions(
    filter: PermissionFilterType,
  ): Promise<PermissionListResponseType> {
    try {
      const { permissions, total, modules } =
        await this.permissionsRepository.findAll(filter);

      return {
        permissions,
        pagination: {
          page: filter.page,
          limit: filter.limit,
          total,
          totalPages: Math.ceil(total / filter.limit) || 0,
        },
        modules,
      };
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
}
