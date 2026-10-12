import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { AccountProfileClient } from "./account-profile-client";

export default async function AccountProfilePage() {
  const user = await authServerRequest.getMe();
  const role = user?.roles.find((item) => item.isPrimary)?.name;
  const headerRole =
    role === RoleName.FREELANCER
      ? "FREELANCER"
      : role === RoleName.CLIENT
        ? "CLIENT"
        : "GUEST";

  return (
    <AccountProfileClient
      userId={user?.id ?? null}
      profileId={user?.profile?.id ?? null}
      headerRole={headerRole}
    />
  );
}
