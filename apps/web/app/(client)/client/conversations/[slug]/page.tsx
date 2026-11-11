import { notFound } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { ChatView } from "@/app/conversations/components/chat-view";

type ClientConversationDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const ClientConversationDetailPage = async ({
  params,
}: ClientConversationDetailPageProps) => {
  const { slug } = await params;

  if (!slug || !slug.trim()) {
    notFound();
  }

  const user = await authServerRequest.getMe();
  const currentUserId = user?.id ?? null;

  return (
    <ChatView
      conversationSlug={slug}
      currentUserId={currentUserId}
    />
  );
};

export default ClientConversationDetailPage;
