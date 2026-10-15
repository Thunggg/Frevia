import { notFound } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { ChatView } from "@/app/conversations/components/chat-view";

type ClientConversationDetailPageProps = {
  params: Promise<{ conversationId: string }>;
};

const ClientConversationDetailPage = async ({
  params,
}: ClientConversationDetailPageProps) => {
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

export default ClientConversationDetailPage;
