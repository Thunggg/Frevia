import type { ReactNode } from "react";
import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { redirect } from "next/navigation";
import { FreelancerSidebar } from "../_components/freelancer-sidebar";

export default async function FreelancerDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await authServerRequest.getMe();

  if (!user) {
    redirect("/login?redirect=/freelancer/find-work");
  }

  const primaryRole =
    user.roles.find((role) => role.isPrimary)?.name ?? user.roles[0]?.name;

  if (primaryRole !== RoleName.FREELANCER) {
    redirect("/access-denied?requiredRole=freelancer");
  }

  return (
    <div className="flex h-dvh bg-background font-sans overflow-hidden">
      <FreelancerSidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <main className="flex-1 overflow-y-auto min-h-0 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
