import { Suspense } from "react";
import authServerRequest from "@/apiRequests/auth.server";
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
  const role = resolveHeaderRole(user?.roles);

  return (
    <Suspense>
      <MySessionsContent role={role} />
    </Suspense>
  );
}
