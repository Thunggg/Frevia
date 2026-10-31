import { getTranslations } from "next-intl/server";
import authServerRequest from "@/apiRequests/auth.server";
import { AccessDeniedContent } from "./access-denied-content";

export async function generateMetadata() {
  const t = await getTranslations("pageMeta");

  return {
    title: t("accessDeniedTitle"),
    description: t("accessDeniedDescription"),
  };
}

type AccessDeniedPageProps = {
  searchParams: Promise<{
    requiredRole?: string;
    from?: string;
  }>;
};

export default async function AccessDeniedPage({
  searchParams,
}: AccessDeniedPageProps) {
  const [{ requiredRole, from }, user] = await Promise.all([
    searchParams,
    authServerRequest.getMe(),
  ]);

  return (
    <AccessDeniedContent
      user={user}
      requiredRole={requiredRole}
      from={from}
    />
  );
}
