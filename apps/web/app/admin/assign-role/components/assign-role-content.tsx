"use client";

import { useAllPermissions } from "@/hooks/use-permission";
import { useRole, useRoles, useSetRolePermissions } from "@/hooks/use-role";
import { ApiFail } from "@/lib/http";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { HttpMethod, type PermissionListItemType } from "@shared/types";
import { Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const METHOD_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  [HttpMethod.GET]: "secondary",
  [HttpMethod.POST]: "default",
  [HttpMethod.PUT]: "outline",
  [HttpMethod.PATCH]: "outline",
  [HttpMethod.DELETE]: "destructive",
};

const HTTP_METHODS = Object.values(HttpMethod);

export function AssignRoleContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const roleIdParam = Number(searchParams.get("roleId"));
  const selectedRoleId =
    Number.isInteger(roleIdParam) && roleIdParam > 0 ? roleIdParam : null;

  // lấy danh sách tất cả các role
  const {
    data: roles = [],
    isLoading: isRolesLoading,
    isError: isRolesError,
  } = useRoles();

  // lấy thông tin chi tiết của role được chọn
  const {
    data: role,
    isLoading: isRoleLoading,
    isError: isRoleError,
  } = useRole(selectedRoleId ?? 0);

  // lấy danh sách tất cả các permission
  const {
    data,
    isLoading: isPermissionsLoading,
    isError: isPermissionsError,
  } = useAllPermissions();

  // cập nhật quyền của role
  const setRolePermissions = useSetRolePermissions();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");

  useEffect(() => {
    if (role && selectedRoleId === role.id) {
      setSelectedIds(new Set(role.permissions.map((p) => p.id)));
      setSearch("");
      setMethodFilter("all");
      setModuleFilter("all");
    }
  }, [role, selectedRoleId]);

  const permissions = useMemo(() => data?.permissions ?? [], [data?.permissions]);
  const modules = data?.modules ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return permissions.filter((permission) => {
      if (methodFilter !== "all" && permission.method !== methodFilter) {
        return false;
      }
      if (moduleFilter !== "all" && permission.module !== moduleFilter) {
        return false;
      }
      if (!q) return true;

      return (
        permission.name.toLowerCase().includes(q) ||
        permission.path.toLowerCase().includes(q) ||
        (permission.module?.toLowerCase().includes(q) ?? false) ||
        String(permission.id).includes(q)
      );
    });
  }, [permissions, search, methodFilter, moduleFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, PermissionListItemType[]>();

    for (const permission of filtered) {
      const key = permission.module || "OTHER";
      const list = map.get(key) ?? [];
      list.push(permission);
      map.set(key, list);
    }

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const selectRole = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "none") {
      params.set("roleId", value);
    } else {
      params.delete("roleId");
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const togglePermission = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleModule = (items: PermissionListItemType[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const item of items) {
        if (checked) next.add(item.id);
        else next.delete(item.id);
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!selectedRoleId) return;

    setRolePermissions.mutate(
      {
        id: selectedRoleId,
        body: { permissionIds: Array.from(selectedIds) },
      },
      {
        onSuccess: (updated) => {
          toastSuccess({
            message: `Updated permissions for "${updated.name}" (${updated.permissions.length})`,
          });
        },
        onError: (error) => {
          if (error instanceof ApiFail) {
            toastError({ message: error.message });
          } else {
            toastError({ message: "Failed to update role permissions" });
          }
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assign Role</h1>
          <p className="text-muted-foreground mt-1">
            Select a role and assign API permissions
            {role ? ` · ${selectedIds.size} selected` : ""}
          </p>
        </div>
        {selectedRoleId && role && (
          <Button
            type="button"
            onClick={handleSave}
            disabled={
              isPermissionsLoading ||
              isPermissionsError ||
              isRoleLoading ||
              setRolePermissions.isPending
            }
          >
            {setRolePermissions.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Save permissions
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select
          value={selectedRoleId ? String(selectedRoleId) : "none"}
          onValueChange={selectRole}
          disabled={isRolesLoading || isRolesError}
        >
          <SelectTrigger className="w-full sm:w-[260px] h-9">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select a role</SelectItem>
            {roles.map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedRoleId && (
          <>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search permissions..."
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {HTTP_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="All modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {modules.map((mod) => (
                  <SelectItem key={mod} value={mod}>
                    {mod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {isRolesError ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Failed to load roles. Please try again.
        </p>
      ) : !selectedRoleId ? (
        <div className="rounded-lg border bg-card py-16 text-center text-sm text-muted-foreground">
          Choose a role to start assigning permissions.
        </div>
      ) : isRoleError ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Failed to load the selected role.
        </p>
      ) : (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          {isRoleLoading || isPermissionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isPermissionsError ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              Failed to load permissions.
            </p>
          ) : grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              No permissions match your filters.
            </p>
          ) : (
            grouped.map(([moduleName, items]) => {
              const selectedCount = items.filter((item) =>
                selectedIds.has(item.id),
              ).length;
              const allSelected = selectedCount === items.length;
              const someSelected =
                selectedCount > 0 && selectedCount < items.length;

              return (
                <div key={moduleName} className="space-y-2">
                  <div className="flex items-center gap-2 sticky top-0 bg-card py-1 z-10">
                    <Checkbox
                      checked={
                        allSelected
                          ? true
                          : someSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={(checked) =>
                        toggleModule(items, checked === true)
                      }
                      aria-label={`Select all ${moduleName}`}
                    />
                    <Badge variant="outline">{moduleName}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {selectedCount}/{items.length}
                    </span>
                  </div>

                  <div className="space-y-1 pl-1">
                    {items.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedIds.has(permission.id)}
                          onCheckedChange={(checked) =>
                            togglePermission(permission.id, checked === true)
                          }
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant={
                                METHOD_VARIANT[permission.method] ?? "outline"
                              }
                            >
                              {permission.method}
                            </Badge>
                            <span className="font-mono text-sm truncate">
                              {permission.path}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            #{permission.id} · {permission.name}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
