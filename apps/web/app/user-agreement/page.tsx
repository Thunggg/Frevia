import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import type { Metadata } from "next";
import { UserAgreementView } from "./user-agreement-view";

export const metadata: Metadata = {
  title: "Freelancer User Agreement | Frevia",
  description:
    "Terms and conditions for freelancers and clients using the Frevia curated freelance marketplace.",
};

export default async function UserAgreementPage() {
  const user = await authServerRequest.getMe();
  const role = user?.roles.find((item) => item.isPrimary)?.name;
  const headerRole =
    role === RoleName.FREELANCER
      ? "FREELANCER"
      : role === RoleName.CLIENT
        ? "CLIENT"
        : "GUEST";

  return <UserAgreementView headerRole={headerRole} />;
}

