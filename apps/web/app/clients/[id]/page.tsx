import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { ClientProfileClient } from "./client-profile-client";

type Props = { params: Promise<{ id: string }> };

export default async function ClientProfilePage({ params }: Props) {
  const [{ id }, user] = await Promise.all([params, authServerRequest.getMe()]);
  const role = user?.roles.find((item) => item.isPrimary)?.name;
  const headerRole =
    role === RoleName.FREELANCER
      ? "FREELANCER"
      : role === RoleName.CLIENT
        ? "CLIENT"
        : "GUEST";
  return (
    <ClientProfileClient
      userId={Number(id)}
      currentUserId={user?.id ?? null}
      headerRole={headerRole}
    />
  );
}
