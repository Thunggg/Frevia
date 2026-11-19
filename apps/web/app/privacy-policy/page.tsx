import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PrivacyPolicyView } from "./privacy-policy-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacyPolicy");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

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

