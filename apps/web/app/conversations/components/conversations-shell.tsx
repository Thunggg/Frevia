"use client";

import type { ReactNode } from "react";
import { ConversationList } from "./conversation-list";

type ConversationsShellProps = {
  currentUserId: number | null;
  children: ReactNode;
};

export function ConversationsShell({
  currentUserId,
  children,
}: ConversationsShellProps) {
  return (
    <div className="flex min-h-0 flex-1 bg-background">
      <ConversationList currentUserId={currentUserId} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
