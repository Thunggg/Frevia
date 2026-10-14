export const ManageUserMessage = {
  ROLE_ID_REQUIRED: "Error.RoleIdRequired",
  EMAIL_ALREADY_EXISTS: "Error.EmailAlreadyExists",
  CREATE_ROLE_NOT_FOUND: "Error.CreateUserRoleNotFound",
  CANNOT_ASSIGN_ADMIN_ROLE: "Error.CannotAssignAdminRole",
  CANNOT_BAN_SELF: "Error.CannotBanSelf",
  NOTHING_TO_UPDATE: "Error.NothingToUpdate",
  FAILED_TO_CREATE_USER: "Error.FailedToCreateUser",
  FAILED_TO_UPDATE_USER: "Error.FailedToUpdateUser",
} as const;
