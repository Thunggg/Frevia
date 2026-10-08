import { MessageSquare } from "lucide-react";
import { NewConversationDialog } from "./components/new-conversation-dialog";

const ConversationsPage = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-full bg-muted p-4">
        <MessageSquare className="h-10 w-10 text-muted-foreground" />
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
