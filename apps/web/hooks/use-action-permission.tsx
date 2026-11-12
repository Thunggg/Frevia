"use client";

import { useMe } from "@/hooks/use-auth";
import { hasActionPermission } from "@/lib/admin-access";
import { RoleName } from "@shared/types";
import { useCallback, useMemo, type ReactNode } from "react";

/**
 * Custom hook quản lý và kiểm tra quyền của người dùng.
 * Cung cấp các hàm kiểm tra một quyền, nhiều quyền và trạng thái toàn quyền.
 */
export function useActionPermission() {
  const { data: user } = useMe();

  // Lấy danh sách permissions, mặc định là mảng rỗng nếu chưa có dữ liệu.
  const permissions = useMemo(
    () => user?.permissions ?? [],
    [user?.permissions],
  );

  // Xác định người dùng có role ADMIN hay không.
  const isAdmin = useMemo(
    () => user?.roles?.some((r) => r.name === RoleName.ADMIN) ?? false,
    [user?.roles],
  );

  // Xác định người dùng có quyền wildcard (*) hay không.
  const hasWildcard = useMemo(
    () => permissions.includes("*"),
    [permissions],
  );

  // Kiểm tra người dùng có quyền thực hiện một action cụ thể hay không.
  const can = useCallback(
    (method: string, path: string): boolean => {
      if (hasWildcard) return true;
      return hasActionPermission(permissions, method, path);
    },
    [hasWildcard, permissions],
  );

  // Kiểm tra người dùng có ít nhất một quyền trong danh sách action.
  const canAny = useCallback(
    (actions: Array<{ method: string; path: string }>): boolean => {
      if (hasWildcard) return true;
      return actions.some((action) => can(action.method, action.path));
    },
    [can, hasWildcard],
  );

  // Kiểm tra người dùng có đầy đủ quyền trên tất cả action trong danh sách.
  const canAll = useCallback(
    (actions: Array<{ method: string; path: string }>): boolean => {
      if (hasWildcard) return true;
      return actions.every((action) => can(action.method, action.path));
    },
    [can, hasWildcard],
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
 * Có quyền thì hiển thị children, không có quyền thì hiển thị fallback.
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

  if (can(method, path)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
