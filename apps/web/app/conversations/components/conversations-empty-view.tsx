import { MessageSquare, Plus } from "@/components/icons";
import { Button } from "@repo/ui/components/shadcn/button";
import { NewConversationDialog } from "./new-conversation-dialog";
import { UserIdAutoRedirect } from "./user-id-auto-redirect";

type ConversationsEmptyViewProps = {
  userId?: string;
};

export const ConversationsEmptyView = ({
  userId,
}: ConversationsEmptyViewProps) => {
  const targetUserId = userId ? Number(userId) : null;

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
