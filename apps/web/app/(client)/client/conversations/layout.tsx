import type { ReactNode } from "react";
import authServerRequest from "@/apiRequests/auth.server";
import { getBrowserSocketUrl } from "@/configs/validate-env";
import { getServerAccessToken } from "@/lib/auth-session";
import { ConversationsShell } from "@/app/conversations/components/conversations-shell";

export default async function ClientConversationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [accessToken, user] = await Promise.all([
    getServerAccessToken(),
    authServerRequest.getMe(),
  ]);
  const token = accessToken ?? null;

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 overflow-hidden">
      <ConversationsShell
        socketUrl={getBrowserSocketUrl()}
        token={token}
        currentUserId={user?.id ?? null}
      >
        {children}
      </ConversationsShell>
    </div>
  );
}
