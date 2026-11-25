import authServerRequest from "@/apiRequests/auth.server";
import { canAccessAdminPortal } from "@/lib/admin-access";
import { RoleName } from "@shared/types";
import { redirect } from "next/navigation";

function buildRedirectWithQuery(
  targetPath: string,
  resolvedSearchParams: Record<string, string | string[] | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (typeof value === "string") {
      query.append(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }
    }
  }
  const suffix = query.toString();
  return suffix ? `${targetPath}?${suffix}` : targetPath;
}

export default async function AccountProfileRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await authServerRequest.getMe();
  if (!user) {
    const target = buildRedirectWithQuery(
      "/account-profile",
      resolvedSearchParams,
    );
    redirect(`/login?redirect=${encodeURIComponent(target)}`);
  }

  const primaryRole =
    user.roles?.find((role) => role.isPrimary)?.name ?? user.roles?.[0]?.name;

  if (primaryRole === RoleName.CLIENT) {
    redirect(buildRedirectWithQuery("/client/profile", resolvedSearchParams));
  }

  if (primaryRole === RoleName.FREELANCER) {
    redirect(
      buildRedirectWithQuery("/freelancer/profile", resolvedSearchParams),
    );
  }

  if (
    primaryRole === RoleName.ADMIN ||
    canAccessAdminPortal(user)
  ) {
    redirect(buildRedirectWithQuery("/admin/profile", resolvedSearchParams));
  }

  redirect("/access-denied?requiredRole=admin");
}

