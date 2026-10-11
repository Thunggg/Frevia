import { MessageSquare } from "lucide-react";
import { NewConversationDialog } from "./components/new-conversation-dialog";

const ConversationsPage = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
        <MessageSquare className="size-7" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-foreground">Your messages</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Select a conversation from the list, or start a new chat with another
          user.
        </p>
      </div>
      <NewConversationDialog />
    </div>
  );
};

export default ConversationsPage;
