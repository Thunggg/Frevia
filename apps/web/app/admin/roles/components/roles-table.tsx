"use client";

import { CreateRoleDialog } from "./create-role-dialog";
import { DeleteRoleDialog } from "./delete-role-dialog";
import { UpdateRoleDialog } from "./update-role-dialog";
import { AdminTableSkeleton } from "../../components/table-skeleton";
import { useRoles } from "@/hooks/use-role";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import { RoleName } from "@shared/types";
import { Eye } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";

const SYSTEM_ROLE_NAMES = new Set<string>(Object.values(RoleName));

export function RolesTable() {
  const t = useTranslations("adminRoles");
  const tCommon = useTranslations("adminCommon");
  const format = useFormatter();
  const { data: roles = [], isLoading, isError } = useRoles();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("subtitle")}
            {!isLoading && !isError
              ? ` ${tCommon("total", { count: roles.length })}`
              : ""}
          </p>
        </div>
        <CreateRoleDialog />
      </div>

      {isLoading ? (
        <AdminTableSkeleton
          columns={["w-16", "w-40", "", "w-24", "w-28", "w-36"]}
          rows={6}
        />
      ) : isError ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          {t("loadFailed")}
        </p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">{tCommon("id")}</TableHead>
                <TableHead>{tCommon("name")}</TableHead>
                <TableHead>{tCommon("description")}</TableHead>
                <TableHead>{tCommon("type")}</TableHead>
                <TableHead>{tCommon("created")}</TableHead>
                <TableHead className="w-36 text-right">
                  {tCommon("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    {t("noRoles")}
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => {
                  const isSystem = SYSTEM_ROLE_NAMES.has(role.name);

                  return (
                    <TableRow key={role.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {role.id}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-md truncate">
                        {role.description || tCommon("empty")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            isSystem
                              ? "border border-[#4fae2e]/25 bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15"
                              : "border border-border bg-muted text-muted-foreground"
                          }
                        >
                          {isSystem ? tCommon("system") : tCommon("custom")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {format.dateTime(new Date(role.createdAt), {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <Link href={`/admin/roles/${role.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <UpdateRoleDialog role={role} />
                          <DeleteRoleDialog role={role} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
