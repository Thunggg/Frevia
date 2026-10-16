import { redirect } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { ConversationsEmptyView } from "./components/conversations-empty-view";

type ConversationsPageProps = {
  searchParams?: Promise<{ userId?: string }>;
};

const ConversationsPage = async ({ searchParams }: ConversationsPageProps) => {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await authServerRequest.getMe();
  const primaryRole =
    user?.roles.find((role) => role.isPrimary)?.name ?? user?.roles[0]?.name;

  if (primaryRole === RoleName.CLIENT) {
    redirect(
      resolvedSearchParams?.userId
        ? `/client/conversations?userId=${resolvedSearchParams.userId}`
        : "/client/conversations",
    );
  }

  if (primaryRole === RoleName.FREELANCER) {
    redirect(
      resolvedSearchParams?.userId
        ? `/freelancer/conversations?userId=${resolvedSearchParams.userId}`
        : "/freelancer/conversations",
    );
  }

  return <ConversationsEmptyView userId={resolvedSearchParams?.userId} />;
};

export default ConversationsPage;
