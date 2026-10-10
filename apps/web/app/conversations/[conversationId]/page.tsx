import { notFound } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
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
  const currentUserId = user?.id ?? null;

  return (
    <ChatView
      conversationId={conversationIdNum}
      currentUserId={currentUserId}
    />
  );
};

export default ConversationDetailPage;
