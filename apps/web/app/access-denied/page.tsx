import authServerRequest from "@/apiRequests/auth.server";
import { AccessDeniedContent } from "./access-denied-content";

export const metadata = {
  title: "Access Denied | Frevia",
  description: "You do not have permission to access this page.",
};

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
