import { Injectable, Logger } from '@nestjs/common';
import {
  CreateRoleBodyType,
  CreateRoleResponseType,
  RoleDetailResponseType,
  RoleListResponseType,
} from '@shared/types';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  FailedToCreateRoleException,
  FailedToLoadRoleDetailException,
  FailedToLoadRolesException,
  RoleAlreadyExistsException,
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

  async createRole(body: CreateRoleBodyType): Promise<CreateRoleResponseType> {
    try {
      const existingRole = await this.rolesRepository.findActiveByName(
        body.name as string,
      );

      if (existingRole) {
        throw RoleAlreadyExistsException();
      }

      const role = await this.rolesRepository.create(body);
      this.logger.log(`Role created successfully: name=${role.name}`);
      return role;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw RoleAlreadyExistsException();
      }
      if (error instanceof PrismaClientKnownRequestError) {
        this.logger.error('Failed to create role', error);
        throw FailedToCreateRoleException();
      }
      throw error;
    }
  }
}
