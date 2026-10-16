import type { ReactNode } from "react";
import { FreelancerSidebar } from "../_components/freelancer-sidebar";

export default function FreelancerDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-dvh bg-background font-sans overflow-hidden">
      <FreelancerSidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <main className="flex-1 overflow-y-auto min-h-0 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
