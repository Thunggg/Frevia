import { ConversationsEmptyView } from "@/app/conversations/components/conversations-empty-view";

type FreelancerConversationsPageProps = {
  searchParams?: Promise<{ userId?: string }>;
};

const FreelancerConversationsPage = async ({
  searchParams,
}: FreelancerConversationsPageProps) => {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return <ConversationsEmptyView userId={resolvedSearchParams?.userId} />;
};

export default FreelancerConversationsPage;
