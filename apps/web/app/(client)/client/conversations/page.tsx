import { ConversationsEmptyView } from "@/app/conversations/components/conversations-empty-view";

type ClientConversationsPageProps = {
  searchParams?: Promise<{ userId?: string }>;
};

const ClientConversationsPage = async ({
  searchParams,
}: ClientConversationsPageProps) => {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return <ConversationsEmptyView userId={resolvedSearchParams?.userId} />;
};

export default ClientConversationsPage;
