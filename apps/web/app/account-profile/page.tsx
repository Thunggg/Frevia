import { redirect } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { AccountProfileClient } from "./account-profile-client";

export default async function AccountProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [user, { tab }] = await Promise.all([
    authServerRequest.getMe(),
    searchParams,
  ]);
  const role = user?.roles.find((item) => item.isPrimary)?.name;

  if (role === RoleName.CLIENT) {
    const query = tab ? `?tab=${tab}` : "";
    redirect(`/client/profile${query}`);
  }

  const headerRole = role === RoleName.FREELANCER ? "FREELANCER" : "GUEST";

  return (
    <AccountProfileClient
      userId={user?.id ?? null}
      profileId={user?.profile?.id ?? null}
      headerRole={headerRole}
    />
  );
}
