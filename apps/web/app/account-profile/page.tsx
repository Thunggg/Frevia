import { redirect } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";

export default async function AccountProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [user, { tab }] = await Promise.all([
    authServerRequest.getMe(),
    searchParams,
  ]);
  const role = (user?.roles.find((item) => item.isPrimary) ?? user?.roles[0])
    ?.name;
  if (role === RoleName.EXPERT) redirect("/expert/profile?edit=1");

  if (role === RoleName.CLIENT) {
    const query = tab ? `?tab=${tab}` : "";
    redirect(`/client/profile${query}`);
  }

  if (role === RoleName.FREELANCER) {
    const query = tab ? `?tab=${tab}` : "";
    redirect(`/freelancer/profile${query}`);
  }

  redirect("/login?redirect=/account-profile");
}
