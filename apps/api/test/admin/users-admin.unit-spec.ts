import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  AdminUserQueryType,
  ExpertProfileMessage,
  ManageUserMessage,
  RoleName,
} from '@shared/types';
import { ExpertProfileRepository } from '../../src/routes/expert-profile/expert-profile.repo';
import { ExpertProfileService } from '../../src/routes/expert-profile/expert-profile.service';
import { ProfileRevisionService } from '../../src/routes/profile-revisions/profile-revision.service';
import { UsersRepository } from '../../src/routes/users/users.repo';
import { UsersService } from '../../src/routes/users/users.service';
import { AuthGateway } from '../../src/shared/gateways/auth.gateway';
import { HashingService } from '../../src/shared/services/hashing.service';

describe('User Management (UF-59 to UF-67)', () => {
  const repository = {
    getUsers: jest.fn(),
    getUserById: jest.fn(),
    findUserByEmail: jest.fn(),
    findActiveRoleById: jest.fn(),
    createUserByAdmin: jest.fn(),
    updateUserByAdmin: jest.fn(),
    findClientProfileEditContext: jest.fn(),
    upsertClientProfileByAdmin: jest.fn(),
    findFreelancerProfileEditContext: jest.fn(),
    ensureFreelancerProfile: jest.fn(),
    updateFreelancerProfileByAdmin: jest.fn(),
    replaceFreelancerSkills: jest.fn(),
    createPortfolioItem: jest.fn(),
    findPortfolioItemOwned: jest.fn(),
    updatePortfolioItemByAdmin: jest.fn(),
    softDeletePortfolioItem: jest.fn(),
  };

  const hashingService = { hash: jest.fn() };
  const authGateway = {
    emitForceLogoutSession: jest.fn(),
    emitForceLogoutUser: jest.fn(),
  };

  const service = new UsersService(
    repository as unknown as UsersRepository,
    hashingService as unknown as HashingService,
    authGateway as unknown as AuthGateway,
  );

  const expertRepository = {
    findByUserId: jest.fn(),
    hasPendingRevision: jest.fn(),
    updateDirect: jest.fn(),
  };

  const expertService = new ExpertProfileService(
    expertRepository as unknown as ExpertProfileRepository,
    {} as unknown as ProfileRevisionService,
  );

  const createdAt = new Date('2026-01-01T00:00:00.000Z');

  const defaultQuery: AdminUserQueryType = {
    page: 1,
    limit: 10,
    sortBy: 'id',
    sortOrder: 'desc',
  };

  const clientUserItem = {
    id: 10,
    email: 'client@frevia.com',
    displayName: 'Client User',
    isBanned: false,
    createdAt,
    roles: [{ id: 2, name: 'Client', isPrimary: true }],
  };

  const prismaUniqueViolation = () =>
    new PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.0.0',
    });

  const userWithRole = (roleId: number, roleName: string) => ({
    id: 20,
    email: 'new@frevia.com',
    isBanned: false,
    profile: { displayName: 'New User' },
    role: { id: roleId, name: roleName },
  });

  const freelancerContext = {
    profileId: 3,
    hasFreelancerRole: true,
    freelancerProfileId: 7,
  };

  beforeEach(() => jest.clearAllMocks());

  describe('UF-59 getUsers', () => {
    // UF-59: Admin xem danh sách người dùng với phân trang mặc định.
    it('returns the paginated user list with default query', async () => {
      const response = {
        users: [clientUserItem],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      repository.getUsers.mockResolvedValue(response);

      const result = await service.getUsers(defaultQuery);

      expect(result).toEqual(response);
      expect(repository.getUsers).toHaveBeenCalledWith(defaultQuery);
    });

    // Bộ lọc vai trò Client được chuyển nguyên vẹn xuống repository.
    it('forwards the Client role filter to the repository', async () => {
      const query: AdminUserQueryType = { ...defaultQuery, role: 'Client' };
      repository.getUsers.mockResolvedValue({
        users: [clientUserItem],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      await service.getUsers(query);

      expect(repository.getUsers).toHaveBeenCalledWith(query);
    });

    // Bộ lọc vai trò Freelancer được chuyển nguyên vẹn xuống repository.
    it('forwards the Freelancer role filter to the repository', async () => {
      const query: AdminUserQueryType = { ...defaultQuery, role: 'Freelancer' };
      repository.getUsers.mockResolvedValue({
        users: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await service.getUsers(query);

      expect(repository.getUsers).toHaveBeenCalledWith(query);
    });

    // Từ khóa tìm kiếm theo email hoặc tên được chuyển nguyên vẹn xuống repository.
    it('forwards the email or name search keyword to the repository', async () => {
      const query: AdminUserQueryType = { ...defaultQuery, search: 'client' };
      repository.getUsers.mockResolvedValue({
        users: [clientUserItem],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const result = await service.getUsers(query);

      expect(repository.getUsers).toHaveBeenCalledWith(query);
      expect(result.users).toHaveLength(1);
    });

    // Trang vượt quá dữ liệu trả về mảng rỗng nhưng vẫn giữ metadata phân trang.
    it('returns an empty list with pagination metadata when the page exceeds the data', async () => {
      repository.getUsers.mockResolvedValue({
        users: [],
        pagination: { page: 9, limit: 10, total: 5, totalPages: 1 },
      });

      const result = await service.getUsers({ ...defaultQuery, page: 9 });

      expect(result.users).toEqual([]);
      expect(result.pagination.total).toBe(5);
    });

    // Ngoại lệ HttpException từ repository được ném lại nguyên vẹn.
    it('rethrows an HttpException raised by the repository', async () => {
      repository.getUsers.mockRejectedValue(new ForbiddenException());

      await expect(service.getUsers(defaultQuery)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    // Lỗi truy vấn cơ sở dữ liệu được chuyển thành FailedToGetUsersException (500).
    it('throws InternalServerErrorException when the database query fails', async () => {
      repository.getUsers.mockRejectedValue(new Error('Query failure'));

      await expect(service.getUsers(defaultQuery)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-60 getUserById', () => {
    // UF-60: Admin xem chi tiết người dùng có vai trò Client.
    it('returns the detail of a user who owns the Client role', async () => {
      const detail = { id: 10, email: 'client@frevia.com', clientProfile: {} };
      repository.getUserById.mockResolvedValue(detail);

      const result = await service.getUserById(10);

      expect(result).toEqual(detail);
      expect(repository.getUserById).toHaveBeenCalledWith(10);
    });

    // Admin xem chi tiết người dùng có vai trò Freelancer.
    it('returns the detail of a user who owns the Freelancer role', async () => {
      const detail = {
        id: 11,
        email: 'freelancer@frevia.com',
        freelancerProfile: {},
      };
      repository.getUserById.mockResolvedValue(detail);

      const result = await service.getUserById(11);

      expect(result).toEqual(detail);
    });

    // Admin xem chi tiết người dùng có vai trò Expert.
    it('returns the detail of a user who owns the Expert role', async () => {
      const detail = { id: 12, email: 'expert@frevia.com', expertProfile: {} };
      repository.getUserById.mockResolvedValue(detail);

      const result = await service.getUserById(12);

      expect(result).toEqual(detail);
    });

    // Repository trả về null thì service ném NotFoundException.
    it('throws NotFoundException when the user does not exist', async () => {
      repository.getUserById.mockResolvedValue(null);

      await expect(service.getUserById(999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // ID biên không hợp lệ (0) cũng trả về NotFoundException.
    it('throws NotFoundException when the user ID is zero', async () => {
      repository.getUserById.mockResolvedValue(null);

      await expect(service.getUserById(0)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // Lỗi truy vấn cơ sở dữ liệu được chuyển thành FailedToGetUserException (500).
    it('throws InternalServerErrorException when the database query fails', async () => {
      repository.getUserById.mockRejectedValue(new Error('Query failure'));

      await expect(service.getUserById(10)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-61 createUser', () => {
    const createBody = {
      email: 'new@frevia.com',
      fullName: 'New User',
      password: 'Password1',
      confirmPassword: 'Password1',
      roleId: 2,
    };

    // UF-61: Admin tạo tài khoản mới với vai trò Client và nhận lại thông tin vai trò đã gán.
    it('creates a user with the Client role and returns the assigned role', async () => {
      repository.findUserByEmail.mockResolvedValue(null);
      repository.findActiveRoleById.mockResolvedValue({
        id: 2,
        name: 'Client',
      });
      hashingService.hash.mockResolvedValue('hashed-password');
      repository.createUserByAdmin.mockResolvedValue(userWithRole(2, 'Client'));

      const result = await service.createUser(createBody);

      expect(repository.createUserByAdmin).toHaveBeenCalledWith({
        email: 'new@frevia.com',
        password: 'hashed-password',
        fullName: 'New User',
        roleId: 2,
        roleName: 'Client',
      });
      expect(result.roles).toEqual([
        { id: 2, name: 'Client', isPrimary: true },
      ]);
      expect(result.displayName).toBe('New User');
    });

    // Admin tạo tài khoản mới với vai trò Freelancer.
    it('creates a user with the Freelancer role', async () => {
      repository.findUserByEmail.mockResolvedValue(null);
      repository.findActiveRoleById.mockResolvedValue({
        id: 3,
        name: 'Freelancer',
      });
      hashingService.hash.mockResolvedValue('hashed-password');
      repository.createUserByAdmin.mockResolvedValue(
        userWithRole(3, 'Freelancer'),
      );

      const result = await service.createUser({ ...createBody, roleId: 3 });

      expect(result.roles[0]?.name).toBe('Freelancer');
    });

    // Email đã tồn tại bị từ chối bằng ConflictException và không tạo tài khoản.
    it('throws ConflictException when the email already exists', async () => {
      repository.findUserByEmail.mockResolvedValue({ id: 5 });

      await expect(service.createUser(createBody)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.createUserByAdmin).not.toHaveBeenCalled();
    });

    // Lỗi P2002 do race condition được chuyển thành ConflictException.
    it('throws ConflictException when Prisma raises a P2002 unique violation', async () => {
      repository.findUserByEmail.mockResolvedValue(null);
      repository.findActiveRoleById.mockResolvedValue({
        id: 2,
        name: 'Client',
      });
      hashingService.hash.mockResolvedValue('hashed-password');
      repository.createUserByAdmin.mockRejectedValue(prismaUniqueViolation());

      await expect(service.createUser(createBody)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    // Role ID không tồn tại hoặc không còn hoạt động trả về NotFoundException.
    it('throws NotFoundException when the role ID does not exist', async () => {
      repository.findUserByEmail.mockResolvedValue(null);
      repository.findActiveRoleById.mockResolvedValue(null);

      await expect(
        service.createUser({ ...createBody, roleId: 999 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Không cho phép gán vai trò Admin khi tạo tài khoản.
    it('throws ForbiddenException when the selected role is Admin', async () => {
      repository.findUserByEmail.mockResolvedValue(null);
      repository.findActiveRoleById.mockResolvedValue({
        id: 1,
        name: RoleName.ADMIN,
      });

      await expect(
        service.createUser({ ...createBody, roleId: 1 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.createUserByAdmin).not.toHaveBeenCalled();
    });

    // Lỗi cơ sở dữ liệu được chuyển thành FailedToCreateUserException (500).
    it('throws InternalServerErrorException when the database insert fails', async () => {
      repository.findUserByEmail.mockResolvedValue(null);
      repository.findActiveRoleById.mockResolvedValue({
        id: 2,
        name: 'Client',
      });
      hashingService.hash.mockResolvedValue('hashed-password');
      repository.createUserByAdmin.mockRejectedValue(
        new Error('Insert failure'),
      );

      await expect(service.createUser(createBody)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-62 updateUser', () => {
    const updatedUser = {
      id: 10,
      email: 'updated@frevia.com',
      isBanned: false,
      profile: { displayName: 'Updated Name' },
      role: { id: 2, name: 'Client' },
    };

    // UF-62: Admin cập nhật email và họ tên của người dùng.
    it('updates the email and full name of a user', async () => {
      repository.findUserByEmail.mockResolvedValue(null);
      repository.updateUserByAdmin.mockResolvedValue(updatedUser);

      const result = await service.updateUser(10, 1, {
        email: 'updated@frevia.com',
        fullName: 'Updated Name',
      });

      expect(repository.updateUserByAdmin).toHaveBeenCalledWith(10, {
        email: 'updated@frevia.com',
        fullName: 'Updated Name',
      });
      expect(result.displayName).toBe('Updated Name');
    });

    // Admin khóa tài khoản của người dùng khác.
    it('bans another user account', async () => {
      repository.updateUserByAdmin.mockResolvedValue({
        ...updatedUser,
        isBanned: true,
      });

      const result = await service.updateUser(10, 1, { isBanned: true });

      expect(result.isBanned).toBe(true);
    });

    // Admin không được tự khóa chính tài khoản của mình.
    it('throws ForbiddenException when an admin bans their own account', async () => {
      await expect(
        service.updateUser(1, 1, { isBanned: true }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.updateUserByAdmin).not.toHaveBeenCalled();
    });

    // Email mới đã thuộc về người dùng khác bị từ chối bằng ConflictException.
    it('throws ConflictException when the new email belongs to another user', async () => {
      repository.findUserByEmail.mockResolvedValue({ id: 99 });

      await expect(
        service.updateUser(10, 1, { email: 'taken@frevia.com' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // ID người dùng không tồn tại trả về NotFoundException.
    it('throws NotFoundException when the target user does not exist', async () => {
      repository.updateUserByAdmin.mockResolvedValue(null);

      await expect(
        service.updateUser(999, 1, { fullName: 'Ghost' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Lỗi P2002 do race condition được chuyển thành ConflictException.
    it('throws ConflictException when Prisma raises a P2002 unique violation', async () => {
      repository.findUserByEmail.mockResolvedValue(null);
      repository.updateUserByAdmin.mockRejectedValue(prismaUniqueViolation());

      await expect(
        service.updateUser(10, 1, { email: 'race@frevia.com' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // Lỗi cơ sở dữ liệu được chuyển thành FailedToUpdateUserException (500).
    it('throws InternalServerErrorException when the database update fails', async () => {
      repository.updateUserByAdmin.mockRejectedValue(
        new Error('Update failure'),
      );

      await expect(
        service.updateUser(10, 1, { fullName: 'Broken' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-63 updateClientProfile', () => {
    const clientProfileRow = {
      id: 5,
      profileId: 3,
      companyName: 'Frevia Co',
      companyDescription: 'Software company',
      website: 'https://frevia.com',
      createdAt,
      updatedAt: createdAt,
    };

    // UF-63: Admin cập nhật hồ sơ công ty cho người dùng có vai trò Client.
    it('updates the company profile of a user with the Client role', async () => {
      repository.findClientProfileEditContext.mockResolvedValue({
        hasClientRole: true,
        clientProfileId: 5,
      });
      repository.upsertClientProfileByAdmin.mockResolvedValue(clientProfileRow);

      const result = await service.updateClientProfile(10, {
        companyName: 'Frevia Co',
        website: 'https://frevia.com',
      });

      expect(repository.upsertClientProfileByAdmin).toHaveBeenCalledWith(10, {
        companyName: 'Frevia Co',
        website: 'https://frevia.com',
      });
      expect(result).toMatchObject({ userId: 10, companyName: 'Frevia Co' });
    });

    // Người dùng không có vai trò Client và chưa có hồ sơ client bị chặn bằng ForbiddenException.
    it('throws ForbiddenException when the user has no Client role and no client profile', async () => {
      repository.findClientProfileEditContext.mockResolvedValue({
        hasClientRole: false,
        clientProfileId: null,
      });

      await expect(
        service.updateClientProfile(10, { companyName: 'X' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.upsertClientProfileByAdmin).not.toHaveBeenCalled();
    });

    // Chuỗi rỗng được chuẩn hóa thành null trước khi lưu.
    it('normalizes blank strings to null before saving', async () => {
      repository.findClientProfileEditContext.mockResolvedValue({
        hasClientRole: true,
        clientProfileId: 5,
      });
      repository.upsertClientProfileByAdmin.mockResolvedValue({
        ...clientProfileRow,
        companyName: null,
        website: null,
      });

      await service.updateClientProfile(10, { companyName: '  ', website: '' });

      expect(repository.upsertClientProfileByAdmin).toHaveBeenCalledWith(10, {
        companyName: null,
        website: null,
      });
    });

    // Người dùng đã có hồ sơ client nhưng không còn vai trò Client vẫn được chỉnh sửa.
    it('allows editing when the user already has a client profile without the Client role', async () => {
      repository.findClientProfileEditContext.mockResolvedValue({
        hasClientRole: false,
        clientProfileId: 5,
      });
      repository.upsertClientProfileByAdmin.mockResolvedValue(clientProfileRow);

      const result = await service.updateClientProfile(10, {
        companyDescription: 'Software company',
      });

      expect(result.id).toBe(5);
    });

    // Người dùng không tồn tại trả về NotFoundException.
    it('throws NotFoundException when the user does not exist', async () => {
      repository.findClientProfileEditContext.mockResolvedValue(null);

      await expect(
        service.updateClientProfile(999, { companyName: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Lỗi cơ sở dữ liệu được chuyển thành FailedToUpdateClientProfileException (500).
    it('throws InternalServerErrorException when the database upsert fails', async () => {
      repository.findClientProfileEditContext.mockResolvedValue({
        hasClientRole: true,
        clientProfileId: 5,
      });
      repository.upsertClientProfileByAdmin.mockRejectedValue(
        new Error('Upsert failure'),
      );

      await expect(
        service.updateClientProfile(10, { companyName: 'X' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-64 updateFreelancerProfile', () => {
    // UF-64: Admin cập nhật thông tin cơ bản của hồ sơ Freelancer.
    it('updates the basic information of a freelancer profile', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue(
        freelancerContext,
      );

      const result = await service.updateFreelancerProfile(11, {
        title: 'Full-stack Developer',
        bio: 'Ten years of experience',
      });

      expect(repository.updateFreelancerProfileByAdmin).toHaveBeenCalledWith(
        11,
        {
          title: 'Full-stack Developer',
          bio: 'Ten years of experience',
        },
      );
      expect(result).toEqual({
        message: ManageUserMessage.FREELANCER_PROFILE_UPDATED,
      });
    });

    // Người dùng không có vai trò Freelancer và chưa có hồ sơ bị chặn bằng ForbiddenException.
    it('throws ForbiddenException when the user has no Freelancer role and no profile', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue({
        profileId: 3,
        hasFreelancerRole: false,
        freelancerProfileId: null,
      });

      await expect(
        service.updateFreelancerProfile(11, { title: 'Dev' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    // Tiêu đề dài đúng 255 ký tự (giá trị biên) được lưu nguyên vẹn.
    it('saves a professional title that has exactly 255 characters', async () => {
      const boundaryTitle = 'T'.repeat(255);
      repository.findFreelancerProfileEditContext.mockResolvedValue(
        freelancerContext,
      );

      await service.updateFreelancerProfile(11, { title: boundaryTitle });

      expect(repository.updateFreelancerProfileByAdmin).toHaveBeenCalledWith(
        11,
        {
          title: boundaryTitle,
        },
      );
    });

    // Danh sách ngôn ngữ được cắt khoảng trắng và loại bỏ phần tử rỗng.
    it('trims list entries and removes blank ones', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue(
        freelancerContext,
      );

      await service.updateFreelancerProfile(11, {
        languages: ['  English ', '', 'Vietnamese'],
      });

      expect(repository.updateFreelancerProfileByAdmin).toHaveBeenCalledWith(
        11,
        {
          languages: ['English', 'Vietnamese'],
        },
      );
    });

    // Danh sách null thành mảng rỗng và chuỗi rỗng thành null.
    it('converts a null list to an empty array and a blank title to null', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue(
        freelancerContext,
      );

      await service.updateFreelancerProfile(11, {
        title: '   ',
        certifications: null,
      });

      expect(repository.updateFreelancerProfileByAdmin).toHaveBeenCalledWith(
        11,
        {
          title: null,
          certifications: [],
        },
      );
    });

    // Lỗi cơ sở dữ liệu được chuyển thành FailedToUpdateFreelancerProfileException (500).
    it('throws InternalServerErrorException when the database update fails', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue(
        freelancerContext,
      );
      repository.updateFreelancerProfileByAdmin.mockRejectedValue(
        new Error('Update failure'),
      );

      await expect(
        service.updateFreelancerProfile(11, { title: 'Dev' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-65 replaceFreelancerSkills', () => {
    // UF-65: Admin thay thế toàn bộ danh sách kỹ năng của hồ sơ Freelancer.
    it('replaces the freelancer skills with the submitted list', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue(
        freelancerContext,
      );
      const skills = [
        { skillName: 'React', proficiencyLevel: 8 },
        { skillName: 'Node.js', proficiencyLevel: 6 },
      ];

      const result = await service.replaceFreelancerSkills(11, { skills });

      expect(repository.replaceFreelancerSkills).toHaveBeenCalledWith(
        7,
        skills,
      );
      expect(result).toEqual({
        message: ManageUserMessage.FREELANCER_SKILLS_UPDATED,
      });
    });

    // Mức thành thạo nhỏ nhất (1) được chuyển nguyên vẹn xuống repository.
    it('forwards the lowest proficiency level of 1 to the repository', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue(
        freelancerContext,
      );
      const skills = [{ skillName: 'Figma', proficiencyLevel: 1 }];

      await service.replaceFreelancerSkills(11, { skills });

      expect(repository.replaceFreelancerSkills).toHaveBeenCalledWith(
        7,
        skills,
      );
    });

    // Mức thành thạo lớn nhất (10) được chuyển nguyên vẹn xuống repository.
    it('forwards the highest proficiency level of 10 to the repository', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue(
        freelancerContext,
      );
      const skills = [{ skillName: 'TypeScript', proficiencyLevel: 10 }];

      await service.replaceFreelancerSkills(11, { skills });

      expect(repository.replaceFreelancerSkills).toHaveBeenCalledWith(
        7,
        skills,
      );
    });

    // Tự tạo hàng hồ sơ freelancer khi người dùng chưa có hồ sơ.
    it('creates the freelancer profile row when the user has none', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue({
        profileId: 3,
        hasFreelancerRole: true,
        freelancerProfileId: null,
      });
      repository.ensureFreelancerProfile.mockResolvedValue(15);
      const skills = [{ skillName: 'React', proficiencyLevel: 5 }];

      await service.replaceFreelancerSkills(11, { skills });

      expect(repository.ensureFreelancerProfile).toHaveBeenCalledWith(11, 3);
      expect(repository.replaceFreelancerSkills).toHaveBeenCalledWith(
        15,
        skills,
      );
    });

    // Không tạo được hồ sơ freelancer thì trả về FailedToSaveSkillsException (500).
    it('throws InternalServerErrorException when the profile row cannot be created', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue({
        profileId: 3,
        hasFreelancerRole: true,
        freelancerProfileId: null,
      });
      repository.ensureFreelancerProfile.mockResolvedValue(null);

      await expect(
        service.replaceFreelancerSkills(11, { skills: [] }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    // Người dùng không có vai trò Freelancer và chưa có hồ sơ bị chặn bằng ForbiddenException.
    it('throws ForbiddenException when the user has no Freelancer role and no profile', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue({
        profileId: 3,
        hasFreelancerRole: false,
        freelancerProfileId: null,
      });

      await expect(
        service.replaceFreelancerSkills(11, { skills: [] }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    // Lỗi cơ sở dữ liệu khi ghi kỹ năng được chuyển thành FailedToSaveSkillsException (500).
    it('throws InternalServerErrorException when saving the skills fails', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue(
        freelancerContext,
      );
      repository.replaceFreelancerSkills.mockRejectedValue(
        new Error('Transaction failure'),
      );

      await expect(
        service.replaceFreelancerSkills(11, {
          skills: [{ skillName: 'React', proficiencyLevel: 5 }],
        }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-66 managePortfolioItem', () => {
    // UF-66: Admin thêm một portfolio item mới cho hồ sơ Freelancer.
    it('creates a portfolio item for the freelancer profile', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue(
        freelancerContext,
      );

      const result = await service.createPortfolioItem(11, {
        title: 'Online Shop',
        description: 'E-commerce website',
        technologies: [' React ', 'Node.js'],
        projectUrl: 'https://shop.example.com',
      });

      expect(repository.createPortfolioItem).toHaveBeenCalledWith(7, {
        title: 'Online Shop',
        description: 'E-commerce website',
        technologies: ['React', 'Node.js'],
        projectUrl: 'https://shop.example.com',
      });
      expect(result).toEqual({
        message: ManageUserMessage.PORTFOLIO_ITEM_CREATED,
      });
    });

    // Admin cập nhật portfolio item thuộc đúng hồ sơ freelancer.
    it('updates a portfolio item that belongs to the freelancer profile', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue(
        freelancerContext,
      );
      repository.findPortfolioItemOwned.mockResolvedValue({
        deletedAt: null,
        freelancerProfileId: 7,
      });

      const result = await service.updatePortfolioItem(11, 50, {
        title: 'Online Shop v2',
      });

      expect(repository.updatePortfolioItemByAdmin).toHaveBeenCalledWith(50, {
        title: 'Online Shop v2',
      });
      expect(result).toEqual({
        message: ManageUserMessage.PORTFOLIO_ITEM_UPDATED,
      });
    });

    // Admin xóa mềm portfolio item thuộc đúng hồ sơ freelancer.
    it('soft-deletes a portfolio item that belongs to the freelancer profile', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue(
        freelancerContext,
      );
      repository.findPortfolioItemOwned.mockResolvedValue({
        deletedAt: null,
        freelancerProfileId: 7,
      });

      const result = await service.deletePortfolioItem(11, 50);

      expect(repository.softDeletePortfolioItem).toHaveBeenCalledWith(50);
      expect(result).toEqual({
        message: ManageUserMessage.PORTFOLIO_ITEM_DELETED,
      });
    });

    // Trường tùy chọn bị bỏ trống được lưu thành null và danh sách công nghệ rỗng.
    it('stores omitted optional fields as null and an empty technology list', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue(
        freelancerContext,
      );

      await service.createPortfolioItem(11, {
        title: 'Minimal item',
        technologies: [],
      });

      expect(repository.createPortfolioItem).toHaveBeenCalledWith(7, {
        title: 'Minimal item',
        description: null,
        technologies: [],
        projectUrl: null,
      });
    });

    // Portfolio item không tồn tại hoặc thuộc hồ sơ khác trả về NotFoundException.
    it('throws NotFoundException when the portfolio item does not belong to the profile', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue(
        freelancerContext,
      );
      repository.findPortfolioItemOwned.mockResolvedValue({
        deletedAt: null,
        freelancerProfileId: 99,
      });

      await expect(
        service.updatePortfolioItem(11, 50, { title: 'Hijack' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.updatePortfolioItemByAdmin).not.toHaveBeenCalled();
    });

    // Người dùng không có vai trò Freelancer và chưa có hồ sơ bị chặn bằng ForbiddenException.
    it('throws ForbiddenException when the user has no Freelancer role and no profile', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue({
        profileId: 3,
        hasFreelancerRole: false,
        freelancerProfileId: null,
      });

      await expect(
        service.createPortfolioItem(11, { title: 'Item', technologies: [] }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    // Portfolio item đã xóa mềm không thể xóa lại và trả về NotFoundException.
    it('throws NotFoundException when the portfolio item is already soft-deleted', async () => {
      repository.findFreelancerProfileEditContext.mockResolvedValue(
        freelancerContext,
      );
      repository.findPortfolioItemOwned.mockResolvedValue({
        deletedAt: createdAt,
        freelancerProfileId: 7,
      });

      await expect(service.deletePortfolioItem(11, 50)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.softDeletePortfolioItem).not.toHaveBeenCalled();
    });
  });

  describe('UF-67 updateByAdmin', () => {
    const expertUser = {
      id: 30,
      profile: { id: 4 },
      role: { name: RoleName.EXPERT },
    };

    const expertBody = {
      displayName: 'Expert One',
      title: 'Security Consultant',
      bio: 'Penetration testing specialist',
      expertise: ['Security'],
      yearsOfExperience: 8,
      education: ['MSc Cyber Security'],
      certifications: ['CISSP'],
      website: 'https://expert.example.com',
      isActive: true,
    };

    // UF-67: Admin cập nhật hồ sơ chuyên gia và nhận thông báo cập nhật thành công.
    it('updates the expert profile and returns the success message', async () => {
      expertRepository.findByUserId.mockResolvedValue(expertUser);

      const result = await expertService.updateByAdmin(30, 1, expertBody);

      expect(expertRepository.updateDirect).toHaveBeenCalledWith(
        30,
        1,
        expertBody,
        expect.any(Number),
      );
      expect(result).toEqual({ message: ExpertProfileMessage.UPDATED });
    });

    // Số năm kinh nghiệm bằng 0 (giá trị biên) vẫn được lưu hợp lệ.
    it('saves the profile when years of experience is zero', async () => {
      expertRepository.findByUserId.mockResolvedValue(expertUser);

      await expertService.updateByAdmin(30, 1, {
        ...expertBody,
        yearsOfExperience: 0,
      });

      expect(expertRepository.updateDirect).toHaveBeenCalledWith(
        30,
        1,
        expect.objectContaining({ yearsOfExperience: 0 }),
        expect.any(Number),
      );
    });

    // Danh sách được cắt khoảng trắng, loại trùng không phân biệt hoa thường và website rỗng thành null.
    it('deduplicates list entries and converts a blank website to null', async () => {
      expertRepository.findByUserId.mockResolvedValue(expertUser);

      await expertService.updateByAdmin(30, 1, {
        ...expertBody,
        expertise: ['React', ' react ', 'Node.js', ''],
        website: '',
      });

      expect(expertRepository.updateDirect).toHaveBeenCalledWith(
        30,
        1,
        expect.objectContaining({
          expertise: ['React', 'Node.js'],
          website: null,
        }),
        expect.any(Number),
      );
    });

    // Người dùng không có vai trò Expert bị chặn bằng ForbiddenException.
    it('throws ForbiddenException when the user does not have the Expert role', async () => {
      expertRepository.findByUserId.mockResolvedValue({
        ...expertUser,
        role: { name: RoleName.CLIENT },
      });

      await expect(
        expertService.updateByAdmin(30, 1, expertBody),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(expertRepository.updateDirect).not.toHaveBeenCalled();
    });

    // Người dùng không có hồ sơ trả về NotFoundException.
    it('throws NotFoundException when the user has no profile', async () => {
      expertRepository.findByUserId.mockResolvedValue(null);

      await expect(
        expertService.updateByAdmin(999, 1, expertBody),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Lỗi ghi cơ sở dữ liệu được ném lại nguyên vẹn.
    it('rethrows the repository error when the direct update fails', async () => {
      const updateError = new Error('Update failure');
      expertRepository.findByUserId.mockResolvedValue(expertUser);
      expertRepository.updateDirect.mockRejectedValue(updateError);

      await expect(expertService.updateByAdmin(30, 1, expertBody)).rejects.toBe(
        updateError,
      );
    });
  });
});
