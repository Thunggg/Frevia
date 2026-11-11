import { notFound, redirect } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { ChatView } from "../components/chat-view";

type ConversationDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const ConversationDetailPage = async ({
  params,
}: ConversationDetailPageProps) => {
  const { slug } = await params;

  if (!slug || !slug.trim()) {
    notFound();
  }

  const user = await authServerRequest.getMe();
  const primaryRole =
    user?.roles.find((role) => role.isPrimary)?.name ?? user?.roles[0]?.name;

  if (primaryRole === RoleName.CLIENT) {
    redirect(`/client/conversations/${slug}`);
  }

  if (primaryRole === RoleName.FREELANCER) {
    redirect(`/freelancer/conversations/${slug}`);
  }

  const currentUserId = user?.id ?? null;

  return (
    <ChatView
      conversationSlug={slug}
      currentUserId={currentUserId}
    />
  );
};

export default ConversationDetailPage;
