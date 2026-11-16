"use client";

import { useAllPermissions } from "@/hooks/use-permission";
import { useRole, useRoles, useSetRolePermissions } from "@/hooks/use-role";
import { useActionPermission } from "@/hooks/use-action-permission";
import { ApiFail } from "@/lib/http";
import {
  getAllFeatureGroups,
  getPermissionFeatureGroup,
  getPermissionScope,
  SCOPE_DEFINITIONS,
  type FeatureGroupDefinition,
  type PermissionScope,
} from "@/lib/permission-scopes";
import { getPermissionDisplayName } from "@/lib/permission-utils";
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
import {
  Briefcase,
  CheckCheck,
  Globe,
  Laptop,
  Layers,
  Loader2,
  Scale,
  Search,
  Shield,
  X,
  XSquare,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  HttpMethodBadge,
  getMethodDotColor,
} from "../../components/http-method-badge";

const HTTP_METHODS = Object.values(HttpMethod);

export function AssignRoleContent() {
  const t = useTranslations("adminAssignRole");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can } = useActionPermission();
  const canAssign = can("PUT", "/api/roles/:id/permissions");

  const roleIdParam = Number(searchParams.get("roleId"));
  const selectedRoleId =
    Number.isInteger(roleIdParam) && roleIdParam > 0 ? roleIdParam : null;

  // Lấy danh sách tất cả các role
  const {
    data: roles = [],
    isLoading: isRolesLoading,
    isError: isRolesError,
  } = useRoles();

  // Lấy thông tin chi tiết của role được chọn
  const {
    data: role,
    isLoading: isRoleLoading,
    isError: isRoleError,
  } = useRole(selectedRoleId ?? 0);

  // Lấy danh sách tất cả các permission
  const {
    data,
    isLoading: isPermissionsLoading,
    isError: isPermissionsError,
  } = useAllPermissions();

  // Cập nhật quyền của role
  const setRolePermissions = useSetRolePermissions();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [featureGroupFilter, setFeatureGroupFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState<PermissionScope>("ALL");

  useEffect(() => {
    if (role && selectedRoleId === role.id) {
      setSelectedIds(new Set(role.permissions.map((p) => p.id)));
      setSearch("");
      setMethodFilter("all");
      setFeatureGroupFilter("all");
      setScopeFilter("ALL");
    }
  }, [role, selectedRoleId]);

  const permissions = useMemo(
    () => data?.permissions ?? [],
    [data?.permissions],
  );

  // Thống kê số lượng quyền theo từng Scope
  const scopeCounts = useMemo(() => {
    const counts: Record<PermissionScope, number> = {
      ALL: permissions.length,
      ADMIN: 0,
      CLIENT: 0,
      FREELANCER: 0,
      CONTRACTS: 0,
      COMMON: 0,
    };
    for (const p of permissions) {
      const scope = getPermissionScope(p);
      counts[scope] = (counts[scope] ?? 0) + 1;
    }
    return counts;
  }, [permissions]);

  // Danh sách các Cụm chức năng hiển thị trong dropdown theo Scope đang chọn
  const availableGroups = useMemo(() => {
    return getAllFeatureGroups(scopeFilter);
  }, [scopeFilter]);

  const handleScopeChange = (scope: PermissionScope) => {
    setScopeFilter(scope);
    setFeatureGroupFilter("all");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return permissions.filter((permission) => {
      const group = getPermissionFeatureGroup(permission);

      if (scopeFilter !== "ALL" && group.scope !== scopeFilter) {
        return false;
      }
      if (methodFilter !== "all" && permission.method !== methodFilter) {
        return false;
      }
      if (featureGroupFilter !== "all" && group.key !== featureGroupFilter) {
        return false;
      }
      if (!q) return true;

      const viName = getPermissionDisplayName(permission, "vi").toLowerCase();
      const enName = getPermissionDisplayName(permission, "en").toLowerCase();

      return (
        viName.includes(q) ||
        enName.includes(q) ||
        permission.name.toLowerCase().includes(q) ||
        permission.path.toLowerCase().includes(q) ||
        group.titleVi.toLowerCase().includes(q) ||
        group.titleEn.toLowerCase().includes(q) ||
        group.code.toLowerCase().includes(q) ||
        (permission.module?.toLowerCase().includes(q) ?? false) ||
        String(permission.id).includes(q)
      );
    });
  }, [permissions, search, methodFilter, featureGroupFilter, scopeFilter]);

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { group: FeatureGroupDefinition; items: PermissionListItemType[] }
    >();

    for (const permission of filtered) {
      const group = getPermissionFeatureGroup(permission);
      const entry = map.get(group.key) ?? { group, items: [] };
      entry.items.push(permission);
      map.set(group.key, entry);
    }

    return Array.from(map.values()).sort(
      (a, b) => a.group.order - b.group.order,
    );
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

  const toggleGroup = (
    items: PermissionListItemType[],
    checked: boolean,
  ) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const item of items) {
        if (checked) next.add(item.id);
        else next.delete(item.id);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const item of filtered) {
        next.add(item.id);
      }
      return next;
    });
  };

  const deselectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const item of filtered) {
        next.delete(item.id);
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!selectedRoleId) return;
    if (!canAssign) {
      toastError({ message: t("noPermissionToAssign") });
      return;
    }

    setRolePermissions.mutate(
      {
        id: selectedRoleId,
        body: { permissionIds: Array.from(selectedIds) },
      },
      {
        onSuccess: (updated) => {
          toastSuccess({
            message: t("savedToast", {
              name: updated.name,
              count: updated.permissions.length,
            }),
          });
        },
        onError: (error) => {
          if (error instanceof ApiFail) {
            toastError({ message: error.message });
          } else {
            toastError({ message: t("updateFailed") });
          }
        },
      },
    );
  };

  const SCOPE_TABS = [
    {
      key: "ALL" as const,
      label: t("allScopes"),
      icon: Layers,
      count: scopeCounts.ALL,
      badgeClass: "",
    },
    {
      key: "ADMIN" as const,
      label: t("scopeAdmin"),
      icon: Shield,
      count: scopeCounts.ADMIN,
      badgeClass: SCOPE_DEFINITIONS.ADMIN.badgeClass,
    },
    {
      key: "CLIENT" as const,
      label: t("scopeClient"),
      icon: Briefcase,
      count: scopeCounts.CLIENT,
      badgeClass: SCOPE_DEFINITIONS.CLIENT.badgeClass,
    },
    {
      key: "FREELANCER" as const,
      label: t("scopeFreelancer"),
      icon: Laptop,
      count: scopeCounts.FREELANCER,
      badgeClass: SCOPE_DEFINITIONS.FREELANCER.badgeClass,
    },
    {
      key: "CONTRACTS" as const,
      label: t("scopeContracts"),
      icon: Scale,
      count: scopeCounts.CONTRACTS,
      badgeClass: SCOPE_DEFINITIONS.CONTRACTS.badgeClass,
    },
    {
      key: "COMMON" as const,
      label: t("scopeCommon"),
      icon: Globe,
      count: scopeCounts.COMMON,
      badgeClass: SCOPE_DEFINITIONS.COMMON.badgeClass,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("pageTitle")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("pageSubtitle")}
            {role ? t("selectedCount", { count: selectedIds.size }) : null}
          </p>
        </div>
        {selectedRoleId && role && canAssign && (
          <Button
            type="button"
            onClick={handleSave}
            disabled={
              isPermissionsLoading ||
              isPermissionsError ||
              isRoleLoading ||
              setRolePermissions.isPending
            }
            className="shadow-sm"
          >
            {setRolePermissions.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            {t("savePermissions")}
          </Button>
        )}
      </div>

      {/* Role Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border bg-card shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
            {t("selectRole")}:
          </span>
          <Select
            value={selectedRoleId ? String(selectedRoleId) : "none"}
            onValueChange={selectRole}
            disabled={isRolesLoading || isRolesError}
          >
            <SelectTrigger className="w-full sm:w-[280px] h-9 font-medium">
              <SelectValue placeholder={t("selectRole")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("selectRole")}</SelectItem>
              {roles.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedRoleId && role && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAllFiltered}
              className="h-8 text-xs gap-1.5"
            >
              <CheckCheck className="size-3.5 text-emerald-600" />
              {t("selectAllInScope")} ({filtered.length})
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={deselectAllFiltered}
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <XSquare className="size-3.5 text-rose-500" />
              {t("deselectAllInScope")}
            </Button>
          </div>
        )}
      </div>

      {selectedRoleId && (
        <div className="space-y-3">
          {/* Scope Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-muted/60 dark:bg-muted/30 rounded-xl border border-border/50">
            {SCOPE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = scopeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleScopeChange(tab.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? "bg-primary/10 text-primary font-bold"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPermissions")}
                className="pl-9 pr-9 h-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={t("clearSearchLabel")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-9">
                <SelectValue placeholder={t("allMethods")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allMethods")}</SelectItem>
                {HTTP_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    <div className="flex items-center gap-2">
                      <span
                        className={`size-2 rounded-full ${getMethodDotColor(method)}`}
                      />
                      <span>{method}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={featureGroupFilter}
              onValueChange={setFeatureGroupFilter}
            >
              <SelectTrigger className="w-full sm:w-[220px] h-9">
                <SelectValue placeholder={t("allModules")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allModules")}</SelectItem>
                {availableGroups.map((group) => (
                  <SelectItem key={group.key} value={group.key}>
                    {locale === "vi" ? group.titleVi : group.titleEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Main Content */}
      {isRolesError ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          {t("rolesLoadFailed")}
        </p>
      ) : !selectedRoleId ? (
        <div className="rounded-xl border bg-card/60 py-16 text-center text-sm text-muted-foreground">
          {t("chooseRolePrompt")}
        </div>
      ) : isRoleError ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          {t("roleLoadFailed")}
        </p>
      ) : (
        <div className="space-y-4">
          {isRoleLoading || isPermissionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : isPermissionsError ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              {t("permissionsLoadFailed")}
            </p>
          ) : grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center rounded-xl border bg-card">
              {t("noMatches")}
            </p>
          ) : (
            grouped.map(({ group, items }) => {
              const selectedCount = items.filter((item) =>
                selectedIds.has(item.id),
              ).length;
              const allSelected = selectedCount === items.length;
              const someSelected =
                selectedCount > 0 && selectedCount < items.length;

              const scopeDef = SCOPE_DEFINITIONS[group.scope];
              const groupTitle =
                locale === "vi" ? group.titleVi : group.titleEn;
              const groupDesc =
                locale === "vi" ? group.descriptionVi : group.descriptionEn;

              return (
                <div
                  key={group.key}
                  className="rounded-xl border bg-card p-4 space-y-3 shadow-xs hover:border-border transition-colors"
                >
                  {/* Group Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={
                          allSelected
                            ? true
                            : someSelected
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={(checked) =>
                          toggleGroup(items, checked === true)
                        }
                        aria-label={t("selectAllModule", {
                          module: groupTitle,
                        })}
                      />
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs font-semibold px-2 py-0.5"
                        >
                          {group.code}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground">
                          {groupTitle}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0.5 border ${scopeDef.badgeClass}`}
                        >
                          <span
                            className={`size-1.5 rounded-full mr-1.5 ${scopeDef.dotColor}`}
                          />
                          {locale === "vi"
                            ? scopeDef.labelVi
                            : scopeDef.labelEn}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground pl-7 sm:pl-0">
                      <span className="font-mono font-medium text-foreground/80">
                        {selectedCount}/{items.length}
                      </span>
                      <span>
                        {locale === "vi" ? "quyền đã chọn" : "selected"}
                      </span>
                    </div>
                  </div>

                  {groupDesc && (
                    <p className="text-xs text-muted-foreground pl-7 -mt-1">
                      {groupDesc}
                    </p>
                  )}

                  {/* Permissions List Grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 pt-1 pl-1">
                    {items.map((permission) => {
                      const displayName = getPermissionDisplayName(
                        permission,
                        locale,
                      );
                      const permScope = getPermissionScope(permission);
                      const permScopeDef = SCOPE_DEFINITIONS[permScope];
                      const isChecked = selectedIds.has(permission.id);

                      return (
                        <label
                          key={permission.id}
                          className={`flex items-start gap-3 rounded-lg p-2.5 cursor-pointer border transition-all ${
                            isChecked
                              ? "bg-primary/[0.03] border-primary/25 dark:bg-primary/[0.06] dark:border-primary/30"
                              : "bg-muted/20 border-border/40 hover:bg-muted/50 hover:border-border"
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              togglePermission(permission.id, checked === true)
                            }
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-sm font-medium text-foreground leading-snug">
                                {displayName}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <HttpMethodBadge
                                  method={permission.method}
                                  className="text-[10px] px-1.5 py-0 h-4"
                                />
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] px-1.5 py-0 h-4 border ${permScopeDef.badgeClass}`}
                                >
                                  {locale === "vi"
                                    ? permScopeDef.labelVi
                                    : permScopeDef.labelEn}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">
                              #{permission.id} · {permission.path}
                            </p>
                          </div>
                        </label>
                      );
                    })}
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
