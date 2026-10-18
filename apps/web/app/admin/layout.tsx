import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { redirect } from "next/navigation";
import { AdminShell } from "./components/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await authServerRequest.getMe();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const hasAdminRole = user.roles.some((r) => r.name === RoleName.ADMIN);

  if (!hasAdminRole) {
    redirect("/access-denied?requiredRole=admin");
  }

  return <AdminShell>{children}</AdminShell>;
}
