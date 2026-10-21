import { notFound, redirect } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { ChatView } from "../components/chat-view";

type ConversationDetailPageProps = {
  params: Promise<{ conversationId: string }>;
};

const ConversationDetailPage = async ({
  params,
}: ConversationDetailPageProps) => {
  const { conversationId } = await params;
  const conversationIdNum = Number(conversationId);

  if (isNaN(conversationIdNum) || conversationIdNum <= 0) {
    notFound();
  }

  const user = await authServerRequest.getMe();
  const primaryRole =
    user?.roles.find((role) => role.isPrimary)?.name ?? user?.roles[0]?.name;

  if (primaryRole === RoleName.CLIENT) {
    redirect(`/client/conversations/${conversationId}`);
  }

  if (primaryRole === RoleName.FREELANCER) {
    redirect(`/freelancer/conversations/${conversationId}`);
  }

  const currentUserId = user?.id ?? null;

  return (
    <ChatView
      conversationId={conversationIdNum}
      currentUserId={currentUserId}
    />
  );
};

export default ConversationDetailPage;
