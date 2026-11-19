import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { UserAgreementView } from "./user-agreement-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("userAgreement");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function UserAgreementPage() {
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

  return <UserAgreementView headerRole={headerRole} />;
}

