import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { ProfilePageClient } from "./profile-page-client";

type ProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const [{ id }, currentUser] = await Promise.all([
    params,
    authServerRequest.getMe(),
  ]);
  const profileId = Number(id);
  const primaryRole = currentUser?.roles.find((role) => role.isPrimary)?.name;
  const headerRole =
    primaryRole === RoleName.FREELANCER
      ? "FREELANCER"
      : primaryRole === RoleName.CLIENT
        ? "CLIENT"
        : "GUEST";

  return (
    <ProfilePageClient
      profileId={profileId}
      currentUserId={currentUser?.id ?? null}
      headerRole={headerRole}
    />
  );
}
