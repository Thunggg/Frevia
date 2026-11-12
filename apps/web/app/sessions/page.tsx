import { Suspense } from "react";
import { redirect } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { canAccessAdminPortal } from "@/lib/admin-access";
import type { UserRole } from "@/components/header";
import { RoleName } from "@shared/types";
import { MySessionsContent } from "./components/my-sessions-content";

function resolveHeaderRole(
  roles: { name: string; isPrimary: boolean }[] | undefined,
): UserRole {
  if (!roles?.length) return "GUEST";
  const primary = roles.find((role) => role.isPrimary) ?? roles[0];
  if (primary?.name === RoleName.CLIENT) return "CLIENT";
  if (primary?.name === RoleName.FREELANCER) return "FREELANCER";
  return "FREELANCER";
}

export default async function SessionsPage() {
  const user = await authServerRequest.getMe();
  const isAdminOrStaff =
    user?.roles.some((role) => role.name === RoleName.ADMIN) ||
    canAccessAdminPortal(user);
  if (isAdminOrStaff) {
    redirect("/admin/sessions");
  }

  const role = resolveHeaderRole(user?.roles);

  return (
    <Suspense>
      <MySessionsContent role={role} />
    </Suspense>
  );
}
