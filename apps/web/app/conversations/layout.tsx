import type { ReactNode } from "react";
import { getMeServer } from "@/lib/get-me";
import { AppHeader } from "@/components/app-header";
import { ConversationsShell } from "./components/conversations-shell";

type ConversationsLayoutProps = {
  children: ReactNode;
};

const ConversationsLayout = async ({ children }: ConversationsLayoutProps) => {
  const user = await getMeServer();

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader />
      <ConversationsShell currentUserId={user?.id ?? null}>
        {children}
      </ConversationsShell>
    </div>
  );
};

export default ConversationsLayout;
