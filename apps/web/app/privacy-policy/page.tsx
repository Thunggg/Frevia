import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import type { Metadata } from "next";
import { PrivacyPolicyView } from "./privacy-policy-view";

export const metadata: Metadata = {
  title: "Privacy Policy | Frevia",
  description:
    "Learn how Frevia collects, protects, and manages your personal data and privacy rights.",
};

export default async function PrivacyPolicyPage() {
  const user = await authServerRequest.getMe();
  const role =
    user?.roles.find((item) => item.isPrimary)?.name ?? user?.roles[0]?.name;
  const headerRole =
    role === RoleName.FREELANCER
      ? "FREELANCER"
      : role === RoleName.CLIENT
        ? "CLIENT"
        : user
          ? "STAFF"
          : "GUEST";

  return <PrivacyPolicyView headerRole={headerRole} />;
}

