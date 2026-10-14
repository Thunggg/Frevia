import { HttpException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  AdminClientProfileResponseType,
  AdminCreatePortfolioItemBodyType,
  AdminCreateUserBodyType,
  AdminCreateUserResponseType,
  AdminReplaceFreelancerSkillsBodyType,
  AdminSkillCatalogListType,
  AdminUpdateClientProfileBodyType,
  AdminUpdateFreelancerProfileBodyType,
  AdminUpdatePortfolioItemBodyType,
  AdminUpdateUserBodyType,
  AdminUpdateUserResponseType,
  AdminUserDetailResponseType,
  AdminUserListResponseType,
  AdminUserQueryType,
  MessageResType,
  RoleName,
} from '@shared/types';
import { HashingService } from '../../shared/services/hashing.service';
import {
  CannotAssignAdminRoleException,
  CannotBanSelfException,
  CreateUserRoleNotFoundException,
  EmailAlreadyExistsException,
  FailedToCreatePortfolioItemException,
  FailedToCreateUserException,
  FailedToDeletePortfolioItemException,
  FailedToGetUserException,
  FailedToGetUsersException,
  FailedToSaveSkillsException,
  FailedToUpdateClientProfileException,
  FailedToUpdateFreelancerProfileException,
  FailedToUpdatePortfolioItemException,
  FailedToUpdateUserException,
  NoClientRoleForClientProfileException,
  NoFreelancerRoleForProfileException,
  PortfolioItemNotFoundException,
  UserNotFoundException,
} from './users.error';
import { UsersRepository } from './users.repo';

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly hashingService: HashingService,
  ) {}

  // ====== Admin tạo tài khoản mới ======
  async createUser(
    body: AdminCreateUserBodyType,
  ): Promise<AdminCreateUserResponseType> {
    try {
      // 1. Email đã tồn tại (chưa soft-delete) → báo trùng
      const existing = await this.repository.findUserByEmail(body.email);
      if (existing) {
        throw EmailAlreadyExistsException();
      }

      // 2. Role khởi tạo phải tồn tại & active; không cho gán role Admin
      const role = await this.repository.findActiveRoleById(body.roleId);
      if (!role) {
        throw CreateUserRoleNotFoundException();
      }
      if (role.name.toLowerCase() === RoleName.ADMIN.toLowerCase()) {
        throw CannotAssignAdminRoleException();
      }

      // 3. Hash password rồi tạo user + profile + userRole (primary)
      const hashedPassword = await this.hashingService.hash(body.password);

      const created = await this.repository.createUserByAdmin({
        email: body.email,
        password: hashedPassword,
        fullName: body.fullName,
        roleId: role.id,
      });

      // Trả về user vừa tạo kèm role để client cập nhật UI
      return {
        id: created.id,
        email: created.email,
        displayName: created.profile?.displayName ?? null,
        roles: created.userRoles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          isPrimary: ur.isPrimary,
        })),
      };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Race condition: email bị tạo song song → unique violation
        throw EmailAlreadyExistsException();
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToCreateUserException();
    }
  }

  // ====== Đọc danh sách user (trang Admin) ======
  async getUsers(
    query: AdminUserQueryType,
  ): Promise<AdminUserListResponseType> {
    try {
      return await this.repository.getUsers(query);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToGetUsersException();
    }
  }

  // ====== Đọc chi tiết 1 user (trang User Detail) ======
  async getUserById(id: number): Promise<AdminUserDetailResponseType> {
    try {
      const user = await this.repository.getUserById(id);
      if (!user) {
        throw UserNotFoundException();
      }
      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToGetUserException();
    }
  }

  // ====== Catalog Skill active (nguồn chọn kỹ năng trong dialog) ======
  async listSkillCatalog(): Promise<AdminSkillCatalogListType> {
    return this.repository.listActiveSkillCatalog();
  }

  // ====== Admin sửa thông tin chung account ======
  // - Không cho admin tự ban chính tài khoản của mình
  // - Đổi email phải kiểm tra trùng với user khác
  async updateUser(
    id: number,
    actorId: number,
    body: AdminUpdateUserBodyType,
  ): Promise<AdminUpdateUserResponseType> {
    try {
      // Admin không được tự ban chính tài khoản của mình
      if (body.isBanned === true && id === actorId) {
        throw CannotBanSelfException();
      }

      // Email đổi sang email đã tồn tại của user khác → báo trùng
      if (body.email !== undefined) {
        const existing = await this.repository.findUserByEmail(body.email);
        if (existing && existing.id !== id) {
          throw EmailAlreadyExistsException();
        }
      }

      // Cập nhật từng trường được gửi lên
      const updated = await this.repository.updateUserByAdmin(id, {
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.fullName !== undefined ? { fullName: body.fullName } : {}),
        ...(body.isBanned !== undefined ? { isBanned: body.isBanned } : {}),
      });

      if (!updated) {
        throw UserNotFoundException();
      }

      return {
        id: updated.id,
        email: updated.email,
        displayName: updated.profile?.displayName ?? null,
        isBanned: updated.isBanned,
        roles: updated.userRoles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          isPrimary: ur.isPrimary,
        })),
      };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Race condition: email vừa bị user khác chiếm → unique violation
        throw EmailAlreadyExistsException();
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToUpdateUserException();
    }
  }

  // ====== Admin sửa hồ sơ CLIENT (công ty) ======
  async updateClientProfile(
    userId: number,
    body: AdminUpdateClientProfileBodyType,
  ): Promise<AdminClientProfileResponseType> {
    try {
      // Kiểm tra user tồn tại và có "quyền" sở hữu hồ sơ client
      const context =
        await this.repository.findClientProfileEditContext(userId);
      if (!context) {
        throw UserNotFoundException();
      }

      // Chỉ cho sửa khi user có role Client hoặc đã có client profile
      const canEdit = context.hasClientRole || context.clientProfileId !== null;
      if (!canEdit) {
        throw NoClientRoleForClientProfileException();
      }

      // Chuẩn hoá: chuỗi rỗng → null (ý nghĩa "xoá nội dung này")
      const clean = (value?: string | null) =>
        typeof value === 'string' && value.trim() === ''
          ? null
          : (value ?? null);

      const data = {
        ...(body.companyName !== undefined
          ? { companyName: clean(body.companyName) }
          : {}),
        ...(body.companyDescription !== undefined
          ? { companyDescription: clean(body.companyDescription) }
          : {}),
        ...(body.website !== undefined ? { website: clean(body.website) } : {}),
      };

      // Upsert: user chưa có client profile thì sẽ tự tạo mới
      const updated = await this.repository.upsertClientProfileByAdmin(
        userId,
        data,
      );
      if (!updated) {
        throw FailedToUpdateClientProfileException();
      }

      return {
        id: updated.id,
        profileId: updated.profileId,
        userId,
        companyName: updated.companyName,
        companyDescription: updated.companyDescription,
        website: updated.website,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToUpdateClientProfileException();
    }
  }

  // ====== Bước chung cho các thao tác hồ sơ FREELANCER ======
  // User phải tồn tại VÀ (có role Freelancer HOẶC đã có freelancer profile)
  private async getFreelancerProfileContext(userId: number) {
    const context =
      await this.repository.findFreelancerProfileEditContext(userId);
    if (!context) {
      throw UserNotFoundException();
    }

    const canEdit =
      context.hasFreelancerRole || context.freelancerProfileId !== null;
    if (!canEdit) {
      throw NoFreelancerRoleForProfileException();
    }

    return context;
  }

  // Nếu user chưa có freelancer profile thì tạo row trống để có freelancerProfileId
  private async ensureFreelancerProfileRow(
    userId: number,
    context: { profileId: number | null; freelancerProfileId: number | null },
  ) {
    if (context.freelancerProfileId !== null) {
      return context.freelancerProfileId;
    }
    return this.repository.ensureFreelancerProfile(userId, context.profileId);
  }

  // Sửa hồ sơ Freelancer: professional title + bio + languages/education/certifications
  async updateFreelancerProfile(
    userId: number,
    body: AdminUpdateFreelancerProfileBodyType,
  ): Promise<MessageResType> {
    try {
      await this.getFreelancerProfileContext(userId);

      // Chuẩn hoá chuỗi: rỗng → null (xoá nội dung)
      const clean = (value?: string | null) =>
        typeof value === 'string' && value.trim() === ''
          ? null
          : (value ?? null);

      // Chuẩn hoá mảng (languages/education/certifications):
      // - cắt khoảng trắng + bỏ dòng rỗng
      // - trống hoặc null → [] (String[] không chứa null; xoá hết = mảng rỗng)
      const cleanList = (value?: string[] | null): string[] | undefined => {
        if (value === undefined) return undefined;
        if (value === null) return [];
        return value.map((item) => item.trim()).filter((item) => item);
      };

      const data = {
        ...(body.title !== undefined ? { title: clean(body.title) } : {}),
        ...(body.bio !== undefined ? { bio: clean(body.bio) } : {}),
        ...(body.languages !== undefined
          ? { languages: cleanList(body.languages) }
          : {}),
        ...(body.education !== undefined
          ? { education: cleanList(body.education) }
          : {}),
        ...(body.certifications !== undefined
          ? { certifications: cleanList(body.certifications) }
          : {}),
      };

      await this.repository.updateFreelancerProfileByAdmin(userId, data);
      return { message: 'Freelancer profile updated successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToUpdateFreelancerProfileException();
    }
  }

  // Thay thế toàn bộ kỹ năng của hồ sơ Freelancer (danh sách chọn từ catalog)
  async replaceFreelancerSkills(
    userId: number,
    body: AdminReplaceFreelancerSkillsBodyType,
  ): Promise<MessageResType> {
    try {
      const context = await this.getFreelancerProfileContext(userId);

      // Đảm bảo đã có freelancer profile để gắn kỹ năng vào
      const freelancerProfileId = await this.ensureFreelancerProfileRow(
        userId,
        context,
      );
      if (freelancerProfileId === null) {
        throw FailedToSaveSkillsException();
      }

      await this.repository.replaceFreelancerSkills(
        freelancerProfileId,
        body.skills,
      );

      return { message: 'Freelancer skills updated successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToSaveSkillsException();
    }
  }

  // Tạo mới 1 portfolio item
  async createPortfolioItem(
    userId: number,
    body: AdminCreatePortfolioItemBodyType,
  ): Promise<MessageResType> {
    try {
      const context = await this.getFreelancerProfileContext(userId);

      const freelancerProfileId = await this.ensureFreelancerProfileRow(
        userId,
        context,
      );
      if (freelancerProfileId === null) {
        throw FailedToCreatePortfolioItemException();
      }

      await this.repository.createPortfolioItem(freelancerProfileId, {
        title: body.title,
        description: body.description ?? null,
        technologies: (body.technologies ?? []).map((tech) => tech.trim()),
        projectUrl: body.projectUrl ?? null,
      });

      return { message: 'Portfolio item created successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToCreatePortfolioItemException();
    }
  }

  // Sửa 1 portfolio item — chỉ cho phép nếu item thuộc đúng freelancer profile của user
  async updatePortfolioItem(
    userId: number,
    itemId: number,
    body: AdminUpdatePortfolioItemBodyType,
  ): Promise<MessageResType> {
    try {
      const context = await this.getFreelancerProfileContext(userId);

      const freelancerProfileId = await this.ensureFreelancerProfileRow(
        userId,
        context,
      );
      if (freelancerProfileId === null) {
        throw FailedToUpdatePortfolioItemException();
      }

      // Kiểm tra item thuộc đúng freelancer profile + chưa bị xoá mềm
      const owned = await this.repository.findPortfolioItemOwned(itemId);
      if (
        !owned ||
        owned.deletedAt !== null ||
        owned.freelancerProfileId !== freelancerProfileId
      ) {
        throw PortfolioItemNotFoundException();
      }

      const clean = (value?: string | null) =>
        typeof value === 'string' && value.trim() === ''
          ? null
          : (value ?? null);

      // Chỉ cập nhật những trường được gửi lên
      await this.repository.updatePortfolioItemByAdmin(itemId, {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined
          ? { description: clean(body.description) }
          : {}),
        ...(body.technologies !== undefined
          ? { technologies: body.technologies.map((tech) => tech.trim()) }
          : {}),
        ...(body.projectUrl !== undefined
          ? { projectUrl: clean(body.projectUrl) }
          : {}),
      });

      return { message: 'Portfolio item updated successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToUpdatePortfolioItemException();
    }
  }

  // Xoá mềm 1 portfolio item (kiểm tra quyền sở hữu trước khi xoá)
  async deletePortfolioItem(
    userId: number,
    itemId: number,
  ): Promise<MessageResType> {
    try {
      const context = await this.getFreelancerProfileContext(userId);

      const freelancerProfileId = await this.ensureFreelancerProfileRow(
        userId,
        context,
      );
      if (freelancerProfileId === null) {
        throw FailedToDeletePortfolioItemException();
      }

      const owned = await this.repository.findPortfolioItemOwned(itemId);
      if (
        !owned ||
        owned.deletedAt !== null ||
        owned.freelancerProfileId !== freelancerProfileId
      ) {
        throw PortfolioItemNotFoundException();
      }

      await this.repository.softDeletePortfolioItem(itemId);

      return { message: 'Portfolio item deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToDeletePortfolioItemException();
    }
  }
}
