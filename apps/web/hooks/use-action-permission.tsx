"use client";

import { useMe } from "@/hooks/use-auth";
import { hasActionPermission } from "@/lib/admin-access";
import { RoleName } from "@shared/types";
import { useCallback, useMemo, type ReactNode } from "react";

/**
 * Custom hook quản lý và kiểm tra quyền của người dùng.
 * Client/Freelancer dùng quy tắc hardcode theo role;
 * Admin/Expert/Custom role kiểm tra động trong phạm vi Admin Portal.
 */
export function useActionPermission() {
  const { data: user } = useMe();

  const permissions = useMemo(
    () => user?.permissions ?? [],
    [user?.permissions],
  );

  const isAdmin = useMemo(
    () => user?.roles?.some((r) => r.name === RoleName.ADMIN) ?? false,
    [user?.roles],
  );

  const can = useCallback(
    (method: string, path: string): boolean => {
      return hasActionPermission(user, method, path);
    },
    [user],
  );

  const canAny = useCallback(
    (actions: Array<{ method: string; path: string }>): boolean => {
      return actions.some((action) => can(action.method, action.path));
    },
    [can],
  );

  const canAll = useCallback(
    (actions: Array<{ method: string; path: string }>): boolean => {
      return actions.every((action) => can(action.method, action.path));
    },
    [can],
  );

  return {
    can,
    canAny,
    canAll,
    isAdmin,
    permissions,
    user,
  };
}

/**
 * Component kiểm soát hiển thị giao diện dựa trên permission.
 */
export function Can({
  method = "GET",
  path,
  fallback = null,
  children,
}: {
  method?: string;
  path: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { can } = useActionPermission();
  return can(method, path) ? <>{children}</> : <>{fallback}</>;
}
