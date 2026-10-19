import { redirect } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { AccountProfileClient } from "@/app/account-profile/account-profile-client";

export const metadata = {
  title: "Profile & Settings | Freelancer Dashboard | Frevia",
  description: "Manage your freelancer profile, skills, identity verification, and reviews.",
};

export default async function FreelancerProfilePage() {
  const user = await authServerRequest.getMe();
  const role = user?.roles.find((item) => item.isPrimary)?.name;

  if (!user || role !== RoleName.FREELANCER) {
    redirect("/account-profile");
  }

  return (
    <AccountProfileClient
      userId={user.id}
      profileId={user.profile?.id ?? null}
      headerRole="FREELANCER"
      embedded={true}
    />
  );
}
