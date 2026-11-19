import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RoleName } from '@shared/types';
import { AuthRepository } from './auth.repo';
import { AuthService } from './auth.service';
import { PrismaService } from '../../shared/services/prisma.service';
import { HashingService } from '../../shared/services/hashing.service';
import { EmailService } from '../../shared/services/email.service';
import { SharedRoleRepository } from '../../shared/repositories/shared-role.repo';
import { TokenService } from '../../shared/services/token.service';

describe('Marketplace Join Role & Switch Role (PA3: User.roleId + UserRole)', () => {
  describe('AuthService', () => {
    let service: AuthService;
    let authRepository: {
      findUserById: jest.Mock;
      switchMarketplaceRole: jest.Mock;
      joinMarketplaceRole: jest.Mock;
    };
    let tokenService: { signAccessToken: jest.Mock };

    beforeEach(() => {
      authRepository = {
        findUserById: jest.fn(),
        switchMarketplaceRole: jest.fn(),
        joinMarketplaceRole: jest.fn(),
      };
      tokenService = {
        signAccessToken: jest.fn().mockResolvedValue('new-access-token'),
      };

      service = new AuthService(
        {} as unknown as HashingService,
        {} as unknown as EmailService,
        {} as unknown as SharedRoleRepository,
        authRepository as unknown as AuthRepository,
        tokenService as unknown as TokenService,
      );
    });

    it('joinRole allows CLIENT to join FREELANCER and signs a fresh accessToken', async () => {
      authRepository.joinMarketplaceRole.mockResolvedValue({
        status: 'joined',
        role: { id: 3, name: RoleName.FREELANCER, description: 'Freelancer' },
      });

      const result = await service.joinRole(10, 99, {
        role: RoleName.FREELANCER,
      });

      expect(result).toEqual({ accessToken: 'new-access-token' });
      expect(tokenService.signAccessToken).toHaveBeenCalledWith({
        userId: 10,
        roleId: 3,
        roleName: RoleName.FREELANCER,
        sessionId: 99,
      });
    });

    it('joinRole rejects ADMIN/EXPERT/custom roles with ForbiddenException', async () => {
      authRepository.joinMarketplaceRole.mockResolvedValue({
        status: 'forbidden',
      });

      await expect(
        service.joinRole(1, 50, { role: RoleName.CLIENT }),
      ).rejects.toThrow(ForbiddenException);
      expect(tokenService.signAccessToken).not.toHaveBeenCalled();
    });

    it('joinRole rejects when target role is already owned with ConflictException', async () => {
      authRepository.joinMarketplaceRole.mockResolvedValue({
        status: 'already-assigned',
        role: { id: 2, name: RoleName.CLIENT, description: 'Client' },
      });

      await expect(
        service.joinRole(10, 99, { role: RoleName.CLIENT }),
      ).rejects.toThrow(ConflictException);
    });

    it('switchRole allows dual-role user to switch between CLIENT and FREELANCER', async () => {
      authRepository.switchMarketplaceRole.mockResolvedValue({
        status: 'switched',
        role: { id: 2, name: RoleName.CLIENT, description: 'Client' },
      });

      const result = await service.switchRole(10, 99, {
        role: RoleName.CLIENT,
      });

      expect(result).toEqual({ accessToken: 'new-access-token' });
      expect(tokenService.signAccessToken).toHaveBeenCalledWith({
        userId: 10,
        roleId: 2,
        roleName: RoleName.CLIENT,
        sessionId: 99,
      });
    });

    it('switchRole rejects non-marketplace users with ForbiddenException', async () => {
      authRepository.switchMarketplaceRole.mockResolvedValue({
        status: 'forbidden',
      });

      await expect(
        service.switchRole(1, 50, { role: RoleName.FREELANCER }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('switchRole rejects when user has not joined target role yet with NotFoundException', async () => {
      authRepository.switchMarketplaceRole.mockResolvedValue({
        status: 'not-owned',
      });

      await expect(
        service.switchRole(10, 99, { role: RoleName.FREELANCER }),
      ).rejects.toThrow(NotFoundException);
    });

    it('getMe returns both CLIENT and FREELANCER roles from explicit userRoles assignments', async () => {
      authRepository.findUserById.mockResolvedValue({
        id: 10,
        email: 'dual@example.com',
        isBanned: false,
        deletedAt: null,
        profile: {
          id: 100,
          displayName: 'Dual User',
          avatarUrl: null,
        },
        role: {
          id: 2,
          name: RoleName.CLIENT,
          description: 'Client role',
          rolePermissions: [],
        },
        userRoles: [
          {
            roleId: 2,
            role: {
              id: 2,
              name: RoleName.CLIENT,
              description: 'Client role',
            },
          },
          {
            roleId: 3,
            role: {
              id: 3,
              name: RoleName.FREELANCER,
              description: 'Freelancer role',
            },
          },
        ],
      });

      const me = await service.getMe(10);

      expect(me.roles).toEqual([
        {
          id: 2,
          name: RoleName.CLIENT,
          description: 'Client role',
          isPrimary: true,
        },
        {
          id: 3,
          name: RoleName.FREELANCER,
          description: 'Freelancer role',
          isPrimary: false,
        },
      ]);
    });

    it('getMe never exposes secondary marketplace roles for ADMIN', async () => {
      authRepository.findUserById.mockResolvedValue({
        id: 1,
        email: 'admin@example.com',
        isBanned: false,
        deletedAt: null,
        profile: {
          id: 10,
          displayName: 'Admin',
          avatarUrl: null,
        },
        role: {
          id: 1,
          name: RoleName.ADMIN,
          description: 'Admin role',
          rolePermissions: [],
        },
        userRoles: [
          {
            roleId: 1,
            role: { id: 1, name: RoleName.ADMIN, description: 'Admin role' },
          },
          {
            roleId: 2,
            role: { id: 2, name: RoleName.CLIENT, description: 'Client role' },
          },
        ],
      });

      const me = await service.getMe(1);

      expect(me.roles).toHaveLength(1);
      expect(me.roles[0]?.name).toBe(RoleName.ADMIN);
    });
  });

  describe('AuthRepository transaction behavior', () => {
    it('joinMarketplaceRole records both roles in UserRole, creates target domain profile, and updates active roleId', async () => {
      const tx = {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 10,
            isBanned: false,
            roleId: 2,
            role: { id: 2, name: RoleName.CLIENT, description: 'Client' },
            userRoles: [{ roleId: 2, role: { id: 2, name: RoleName.CLIENT } }],
          }),
          update: jest.fn().mockResolvedValue({ id: 10, roleId: 3 }),
        },
        role: {
          findFirst: jest.fn().mockResolvedValue({
            id: 3,
            name: RoleName.FREELANCER,
            description: 'Freelancer',
          }),
        },
        userRole: {
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        profile: {
          upsert: jest.fn().mockResolvedValue({ id: 100 }),
        },
        clientProfile: {
          upsert: jest.fn(),
        },
        freelancerProfile: {
          upsert: jest.fn().mockResolvedValue({ id: 300 }),
        },
      };

      const prisma = {
        $transaction: jest.fn((cb: (client: typeof tx) => unknown) =>
          Promise.resolve(cb(tx)),
        ),
      };

      const repo = new AuthRepository(prisma as unknown as PrismaService);
      const result = await repo.joinMarketplaceRole(10, RoleName.FREELANCER);

      expect(result).toEqual({
        status: 'joined',
        role: { id: 3, name: RoleName.FREELANCER, description: 'Freelancer' },
      });
      expect(tx.userRole.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 10, roleId: 2 },
          { userId: 10, roleId: 3 },
        ],
        skipDuplicates: true,
      });
      expect(tx.freelancerProfile.upsert).toHaveBeenCalledWith({
        where: { profileId: 100 },
        create: { profileId: 100 },
        update: {},
      });
      expect(tx.clientProfile.upsert).not.toHaveBeenCalled();
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { roleId: 3 },
      });
    });

    it('switchMarketplaceRole updates active roleId only when target role exists in UserRole', async () => {
      const tx = {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 10,
            isBanned: false,
            roleId: 2,
            role: { id: 2, name: RoleName.CLIENT, description: 'Client' },
            userRoles: [
              {
                roleId: 2,
                role: { id: 2, name: RoleName.CLIENT, description: 'Client' },
              },
              {
                roleId: 3,
                role: {
                  id: 3,
                  name: RoleName.FREELANCER,
                  description: 'Freelancer',
                },
              },
            ],
          }),
          update: jest.fn().mockResolvedValue({ id: 10, roleId: 3 }),
        },
      };

      const prisma = {
        $transaction: jest.fn((cb: (client: typeof tx) => unknown) =>
          Promise.resolve(cb(tx)),
        ),
      };

      const repo = new AuthRepository(prisma as unknown as PrismaService);
      const result = await repo.switchMarketplaceRole(10, RoleName.FREELANCER);

      expect(result).toEqual({
        status: 'switched',
        role: { id: 3, name: RoleName.FREELANCER, description: 'Freelancer' },
      });
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { roleId: 3 },
      });
    });

    it('switchMarketplaceRole returns not-owned when target role is absent from UserRole', async () => {
      const tx = {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 10,
            isBanned: false,
            roleId: 2,
            role: { id: 2, name: RoleName.CLIENT, description: 'Client' },
            userRoles: [
              {
                roleId: 2,
                role: { id: 2, name: RoleName.CLIENT, description: 'Client' },
              },
            ],
          }),
          update: jest.fn(),
        },
      };

      const prisma = {
        $transaction: jest.fn((cb: (client: typeof tx) => unknown) =>
          Promise.resolve(cb(tx)),
        ),
      };

      const repo = new AuthRepository(prisma as unknown as PrismaService);
      const result = await repo.switchMarketplaceRole(10, RoleName.FREELANCER);

      expect(result).toEqual({ status: 'not-owned' });
      expect(tx.user.update).not.toHaveBeenCalled();
    });

    it('switchMarketplaceRole returns forbidden when current user is ADMIN or custom role', async () => {
      const tx = {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1,
            isBanned: false,
            roleId: 1,
            role: { id: 1, name: RoleName.ADMIN, description: 'Admin' },
            userRoles: [
              {
                roleId: 1,
                role: { id: 1, name: RoleName.ADMIN, description: 'Admin' },
              },
            ],
          }),
          update: jest.fn(),
        },
      };

      const prisma = {
        $transaction: jest.fn((cb: (client: typeof tx) => unknown) =>
          Promise.resolve(cb(tx)),
        ),
      };

      const repo = new AuthRepository(prisma as unknown as PrismaService);
      const result = await repo.switchMarketplaceRole(1, RoleName.CLIENT);

      expect(result).toEqual({ status: 'forbidden' });
      expect(tx.user.update).not.toHaveBeenCalled();
    });
  });
});
