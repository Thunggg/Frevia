export const RoleName = {
  ADMIN: "Admin",
  CLIENT: "Client",
  FREELANCER: "Freelancer",
} as const;

export type RoleNameType = (typeof RoleName)[keyof typeof RoleName];

export const HTTPMethod = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
  OPTIONS: "OPTIONS",
  HEAD: "HEAD",
} as const;

export type HTTPMethodType = (typeof HTTPMethod)[keyof typeof HTTPMethod];
