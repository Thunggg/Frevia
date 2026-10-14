import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

// ====== Các exception dùng cho luồng Admin quản lý User ======
// Mỗi exception trả về details [{ message: mã lỗi (dùng làm key i18n), path: trường liên quan }]

// ====== Đọc thông tin user ======
export const UserForbiddenException = () =>
  new ForbiddenException([
    {
      message: 'Error.UserForbidden',
      path: 'roleName',
    },
  ]);

// Lỗi chung khi đọc danh sách user
export const FailedToGetUsersException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToGetUsers',
      path: 'users',
    },
  ]);

// User không tồn tại (hoặc đã soft-delete)
export const UserNotFoundException = () =>
  new NotFoundException([
    {
      message: 'Error.UserNotFound',
      path: 'userId',
    },
  ]);

export const FailedToGetUserException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToGetUser',
      path: 'userId',
    },
  ]);

// ====== Tạo user ======
// Email đã có user khác dùng (kiểm tra trước + bắt race P2002)
export const EmailAlreadyExistsException = () =>
  new ConflictException([
    {
      message: 'Error.EmailAlreadyExists',
      path: 'email',
    },
  ]);

// Role khởi tạo không tồn tại / đã bị xoá
export const CreateUserRoleNotFoundException = () =>
  new NotFoundException([
    {
      message: 'Error.CreateUserRoleNotFound',
      path: 'roleId',
    },
  ]);

// Không cho admin tạo user với role Admin (chống leo quyền)
export const CannotAssignAdminRoleException = () =>
  new ForbiddenException([
    {
      message: 'Error.CannotAssignAdminRole',
      path: 'roleId',
    },
  ]);

export const FailedToCreateUserException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToCreateUser',
      path: 'users',
    },
  ]);

// ====== Sửa thông tin chung account ======
export const FailedToUpdateUserException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToUpdateUser',
      path: 'users',
    },
  ]);

// Admin không được tự ban chính tài khoản đang đăng nhập
export const CannotBanSelfException = () =>
  new ForbiddenException([
    {
      message: 'Error.CannotBanSelf',
      path: 'isBanned',
    },
  ]);

// ====== Sửa hồ sơ Client ======
// User không có role Client và cũng chưa có client profile → không được sửa
export const NoClientRoleForClientProfileException = () =>
  new ForbiddenException([
    {
      message: 'Error.UserHasNoClientRole',
      path: 'userId',
    },
  ]);

export const FailedToUpdateClientProfileException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToUpdateClientProfile',
      path: 'userId',
    },
  ]);

// ====== Sửa hồ sơ Freelancer (intro / skills / portfolio) ======
// User không có role Freelancer và chưa có freelancer profile → không được sửa
export const NoFreelancerRoleForProfileException = () =>
  new ForbiddenException([
    {
      message: 'Error.UserHasNoFreelancerRole',
      path: 'userId',
    },
  ]);

export const FailedToUpdateFreelancerProfileException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToUpdateFreelancerProfile',
      path: 'userId',
    },
  ]);

export const FailedToSaveSkillsException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToSaveSkills',
      path: 'userId',
    },
  ]);

// Portfolio item không tồn tại / đã xoá / không thuộc freelancer profile này
export const PortfolioItemNotFoundException = () =>
  new NotFoundException([
    {
      message: 'Error.PortfolioItemNotFound',
      path: 'portfolioItemId',
    },
  ]);

export const FailedToCreatePortfolioItemException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToCreatePortfolioItem',
      path: 'portfolioItemId',
    },
  ]);

export const FailedToUpdatePortfolioItemException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToUpdatePortfolioItem',
      path: 'portfolioItemId',
    },
  ]);

export const FailedToDeletePortfolioItemException = () =>
  new InternalServerErrorException([
    {
      message: 'Error.FailedToDeletePortfolioItem',
      path: 'portfolioItemId',
    },
  ]);
