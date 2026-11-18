import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { ClientProfileClient } from "./client-profile-client";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function ClientProfilePage({ params }: Props) {
  const [{ id }, user] = await Promise.all([params, authServerRequest.getMe()]);
  const userId = Number(id);
  if (!Number.isSafeInteger(userId) || userId <= 0) notFound();
  const role =
    user?.roles.find((item) => item.isPrimary)?.name ?? user?.roles[0]?.name;
  const headerRole =
    role === RoleName.FREELANCER
      ? "FREELANCER"
      : role === RoleName.CLIENT
        ? "CLIENT"
        : "GUEST";
  return (
    <ClientProfileClient
      userId={userId}
      currentUserId={user?.id ?? null}
      headerRole={headerRole}
    />
  );
}
