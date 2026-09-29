import { Injectable, Logger } from '@nestjs/common';
import {
  RoleDetailResponseType,
  RoleListResponseType,
} from '@shared/types';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  FailedToLoadRoleDetailException,
  FailedToLoadRolesException,
} from './roles.error';
import { RolesRepository } from './roles.repo';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly rolesRepository: RolesRepository) {}

  async getRoles(): Promise<RoleListResponseType> {
    try {
      return await this.rolesRepository.findAll();
    } catch (error) {
      this.logger.error('Failed to load roles', error);
      throw FailedToLoadRolesException();
    }
  }

  async getRoleById(id: number): Promise<RoleDetailResponseType> {
    try {
      return await this.rolesRepository.findById(id);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        this.logger.error(`Failed to load role detail: id=${id}`, error);
        throw FailedToLoadRoleDetailException();
      }
      throw error;
    }
  }
}
