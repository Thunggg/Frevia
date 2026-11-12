import { cookies } from "next/headers";
import type { ReactNode } from "react";

import authServerRequest from "@/apiRequests/auth.server";
import { envConfig } from "@/configs/validate-env";

import { ConversationsShell } from "./components/conversations-shell";

type ConversationsLayoutProps = {
  children: ReactNode;
};

const ConversationsLayout = async ({ children }: ConversationsLayoutProps) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value ?? null;
  const user = await authServerRequest.getMe();
  
  return (
    <div className="flex h-dvh flex-col bg-background font-sans">
      <div className="min-h-0 flex-1">
        <ConversationsShell
          socketUrl={envConfig?.NESTJS_API_URL ?? ""}
          token={token}
          currentUserId={user?.id ?? null}
        >
          {children}
        </ConversationsShell>
      </div>
    </div>
  );
};

export default ConversationsLayout;
