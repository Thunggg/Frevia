import { MessageSquare } from "lucide-react";
import { NewConversationDialog } from "./components/new-conversation-dialog";

const ConversationsPage = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-full bg-[#eaf8df] p-4 dark:bg-[#1a1c1a]">
        <MessageSquare className="h-10 w-10 text-[#4fae2e]" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Your messages
        </h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Select a conversation from the list to start chatting, or create a
          new one.
        </p>
      </div>
      <NewConversationDialog />
    </div>
  );
};

export default ConversationsPage;
