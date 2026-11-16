import authServerRequest from "@/apiRequests/auth.server";
import { canAccessAdminPortal } from "@/lib/admin-access";
import { redirect } from "next/navigation";
import { AdminShell } from "./components/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await authServerRequest.getMe();

  if (!user || user.isBanned) {
    redirect("/login?redirect=/admin");
  }

  if (!canAccessAdminPortal(user)) {
    redirect("/access-denied?requiredRole=admin");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
