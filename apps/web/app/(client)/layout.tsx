import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { redirect } from "next/navigation";
import { ClientSidebar } from "./_components/client-sidebar";

export default async function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await authServerRequest.getMe();

  if (!user) {
    redirect("/login?redirect=/client/jobs");
  }

  const primaryRole =
    user.roles.find((role) => role.isPrimary)?.name ?? user.roles[0]?.name;

  if (primaryRole !== RoleName.CLIENT) {
    redirect("/access-denied?requiredRole=client");
  }

  return (
    <div className="flex h-dvh bg-background font-sans overflow-hidden">
      <ClientSidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <main className="flex-1 overflow-y-auto min-h-0 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
