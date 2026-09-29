import { Injectable, Logger } from '@nestjs/common';
import {
  CreateRoleBodyType,
  CreateRoleResponseType,
  RoleDetailResponseType,
  RoleListResponseType,
  RoleName,
  UpdateRoleBodyType,
  UpdateRoleResponseType,
} from '@shared/types';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  CannotModifySystemRoleException,
  FailedToCreateRoleException,
  FailedToLoadRoleDetailException,
  FailedToLoadRolesException,
  FailedToUpdateRoleException,
  RoleAlreadyExistsException,
} from './roles.error';
import { RolesRepository } from './roles.repo';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly rolesRepository: RolesRepository) {}

  private isSystemRoleName(name: string): boolean {
    return Object.values(RoleName).some(
      (systemName) => systemName.toLowerCase() === name.trim().toLowerCase(),
    );
  }

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
      if (this.isSystemRoleName(body.name as string)) {
        throw CannotModifySystemRoleException();
      }

      const existingRole = await this.rolesRepository.findActiveByName(
        body.name as string,
      );

      if (existingRole) {
        throw RoleAlreadyExistsException();
      }

      const role = await this.rolesRepository.createRole(body);
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

  async updateRole(
    id: number,
    body: UpdateRoleBodyType,
  ): Promise<UpdateRoleResponseType> {
    try {
      const role = await this.rolesRepository.findById(id);

      if (this.isSystemRoleName(role.name)) {
        throw CannotModifySystemRoleException();
      }

      if (
        body.name !== undefined &&
        this.isSystemRoleName(body.name as string)
      ) {
        throw CannotModifySystemRoleException();
      }

      if (body.name !== undefined) {
        const existingRole = await this.rolesRepository.findActiveByName(
          body.name as string,
          id,
        );

        if (existingRole) {
          throw RoleAlreadyExistsException();
        }
      }

      const updatedRole = await this.rolesRepository.updateRole(id, body);
      this.logger.log(`Role updated successfully: id=${id}`);
      return updatedRole;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw RoleAlreadyExistsException();
      }
      if (error instanceof PrismaClientKnownRequestError) {
        this.logger.error(`Failed to update role: id=${id}`, error);
        throw FailedToUpdateRoleException();
      }
      throw error;
    }
  }
}
