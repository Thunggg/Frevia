import type { ReactNode } from "react";
import authServerRequest from "@/apiRequests/auth.server";
import accountProfileServerRequest from "@/apiRequests/account-profile.server";
import { RoleName, VerificationStatus } from "@shared/types";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { FreelancerSidebar } from "../_components/freelancer-sidebar";

export default async function FreelancerDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await authServerRequest.getMe();

  if (!user || user.isBanned) {
    redirect("/login?redirect=/freelancer/find-work");
  }

  const primaryRole =
    user.roles.find((role) => role.isPrimary)?.name ?? user.roles[0]?.name;

  if (primaryRole !== RoleName.FREELANCER) {
    redirect("/access-denied?requiredRole=freelancer");
  }

  // ====== Trạm kiểm soát KYC ======
  // Freelancer chỉ được vào dashboard khi đã xác minh danh tính bằng AI
  // (IDVerification pipeline) VÀ được admin duyệt (APPROVED).
  // Trang /freelancer/profile được miễn chặn để user hoàn tất xác minh.
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "";
  if (!pathname.startsWith("/freelancer/profile")) {
    let identityStatus: VerificationStatus | null | undefined;
    try {
      identityStatus = (await accountProfileServerRequest.getIdentityStatus())
        ?.status;
    } catch {
      // Backend lỗi → fail-open (không chặn để sự cố hạ tầng không vô hiệu
      // hóa toàn bộ dashboard); trạng thái xác minh sẽ được kiểm lại ở lần
      // request kế tiếp.
      identityStatus = undefined;
    }
    if (
      identityStatus !== undefined &&
      identityStatus !== VerificationStatus.APPROVED
    ) {
      redirect("/freelancer/profile?tab=identity");
    }
  }

  return (
    <>
      <style>{`html, body { overflow: hidden; }`}</style>
      <div className="flex h-dvh bg-background font-sans overflow-hidden">
        <FreelancerSidebar />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <main className="flex-1 overflow-y-auto min-h-0 flex flex-col">{children}</main>
        </div>
      </div>
    </>
  );
}
