import type { ReactNode } from "react";
import authServerRequest from "@/apiRequests/auth.server";
import accountProfileServerRequest from "@/apiRequests/account-profile.server";
import { RoleName, VerificationStatus, type VerificationStatusType } from "@shared/types";
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
    redirect("/login?redirect=/freelancer");
  }

  const primaryRole =
    user.roles.find((role) => role.isPrimary)?.name ?? user.roles[0]?.name;

  if (primaryRole !== RoleName.FREELANCER) {
    redirect("/access-denied?requiredRole=freelancer");
  }

  // ====== Trạm kiểm soát KYC ======
  // Freelancer chỉ được vào các khu vực cần thao tác (đề xuất, hợp đồng, ...)
  // khi đã xác minh danh tính bằng AI VÀ được admin duyệt (APPROVED).
  // Các trang duyệt việc / chi tiết việc / hồ sơ được miễn chặn để user có thể
  // xem việc trước, xác minh danh tính chỉ xử lý khi thực sự cần thao tác.
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "";
  const isIdentityExempt =
    pathname === "/freelancer" ||
    pathname.startsWith("/freelancer/profile") ||
    pathname.startsWith("/freelancer/find-work") ||
    pathname.startsWith("/freelancer/jobs") ||
    pathname.startsWith("/freelancer/categories") ||
    pathname.startsWith("/freelancer/search") ||
    pathname.startsWith("/freelancer/conversations") ||
    pathname === ""; // Fail-open nếu không biết pathname (tránh redirect loop)
  if (!isIdentityExempt) {
    let identityStatus: VerificationStatusType | null | undefined;
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
