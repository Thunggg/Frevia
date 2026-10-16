import { redirect } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { MessageSquare, Plus } from "@/components/icons";
import { Button } from "@repo/ui/components/shadcn/button";
import { RoleName } from "@shared/types";
import { NewConversationDialog } from "./components/new-conversation-dialog";
import { UserIdAutoRedirect } from "./components/user-id-auto-redirect";

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

  const targetUserId = resolvedSearchParams?.userId
    ? Number(resolvedSearchParams.userId)
    : null;

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-4 px-6 text-center font-sans">
      {targetUserId && targetUserId > 0 ? (
        <UserIdAutoRedirect targetUserId={targetUserId} />
      ) : null}

      <div className="flex size-14 items-center justify-center rounded-full bg-[#F1F0F5] dark:bg-zinc-800 text-muted-foreground">
        <MessageSquare className="size-6 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
          Your messages
        </h1>
        <p className="mt-1.5 max-w-sm text-xs font-normal text-muted-foreground leading-relaxed">
          Select a conversation from the sidebar, or start a new chat with another user.
        </p>
      </div>
      <NewConversationDialog
        trigger={
          <Button className="mt-2 rounded-full bg-[#0069D3] text-white hover:bg-[#0058b3] px-5 py-2 text-xs font-semibold shadow-xs gap-1.5 cursor-pointer">
            <Plus className="size-3.5" />
            <span>New message</span>
          </Button>
        }
      />
    </div>
  );
};

export default ConversationsPage;
