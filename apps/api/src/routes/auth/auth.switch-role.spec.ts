import { ConflictException, NotFoundException } from '@nestjs/common';
import { RoleName } from '@shared/types';
import { SharedRoleRepository } from '../../shared/repositories/shared-role.repo';
import { EmailService } from '../../shared/services/email.service';
import { HashingService } from '../../shared/services/hashing.service';
import { TokenService } from '../../shared/services/token.service';
import { AuthRepository } from './auth.repo';
import { AuthService } from './auth.service';

describe('AuthService switchRole', () => {
  const authRepository = {
    joinRole: jest.fn(),
    switchPrimaryRole: jest.fn(),
  };
  const tokenService = {
    signAccessToken: jest.fn(),
  };
  const service = new AuthService(
    {} as HashingService,
    {} as EmailService,
    {} as SharedRoleRepository,
    authRepository as unknown as AuthRepository,
    tokenService as unknown as TokenService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('issues an access token for the selected assigned role and same session', async () => {
    authRepository.switchPrimaryRole.mockResolvedValue({
      id: 2,
      name: RoleName.FREELANCER,
    });
    tokenService.signAccessToken.mockResolvedValue('new-access-token');

    await expect(
      service.switchRole(10, 22, { role: RoleName.FREELANCER }),
    ).resolves.toEqual({ accessToken: 'new-access-token' });
    expect(tokenService.signAccessToken).toHaveBeenCalledWith({
      userId: 10,
      roleId: 2,
      roleName: RoleName.FREELANCER,
      sessionId: 22,
    });
  });

  it('rejects switching to a role the user does not have', async () => {
    authRepository.switchPrimaryRole.mockResolvedValue(null);

    await expect(
      service.switchRole(10, 22, { role: RoleName.CLIENT }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('adds the missing role, makes it active, and issues a token for the same session', async () => {
    authRepository.joinRole.mockResolvedValue({
      status: 'joined',
      role: { id: 3, name: RoleName.CLIENT },
    });
    tokenService.signAccessToken.mockResolvedValue('joined-access-token');

    await expect(
      service.joinRole(10, 22, { role: RoleName.CLIENT }),
    ).resolves.toEqual({ accessToken: 'joined-access-token' });
    expect(authRepository.joinRole).toHaveBeenCalledWith(10, RoleName.CLIENT);
    expect(tokenService.signAccessToken).toHaveBeenCalledWith({
      userId: 10,
      roleId: 3,
      roleName: RoleName.CLIENT,
      sessionId: 22,
    });
  });

  it('rejects joining a role already assigned to the user', async () => {
    authRepository.joinRole.mockResolvedValue({
      status: 'already-assigned',
      role: { id: 3, name: RoleName.CLIENT },
    });

    await expect(
      service.joinRole(10, 22, { role: RoleName.CLIENT }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tokenService.signAccessToken).not.toHaveBeenCalled();
  });

  it('rejects joining a role that is unavailable', async () => {
    authRepository.joinRole.mockResolvedValue(null);

    await expect(
      service.joinRole(10, 22, { role: RoleName.FREELANCER }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
