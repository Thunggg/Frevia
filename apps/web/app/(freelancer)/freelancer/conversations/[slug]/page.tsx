import { notFound } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { ChatView } from "@/app/conversations/components/chat-view";

type FreelancerConversationDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const FreelancerConversationDetailPage = async ({
  params,
}: FreelancerConversationDetailPageProps) => {
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

export default FreelancerConversationDetailPage;
