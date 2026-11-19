import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import authServerRequest from "@/apiRequests/auth.server";
import { getBrowserSocketUrl } from "@/configs/validate-env";
import { getServerAccessToken } from "@/lib/auth-session";
import { RoleName } from "@shared/types";

import { ConversationsShell } from "./components/conversations-shell";

type ConversationsLayoutProps = {
  children: ReactNode;
};

const ConversationsLayout = async ({ children }: ConversationsLayoutProps) => {
  const [accessToken, user] = await Promise.all([
    getServerAccessToken(),
    authServerRequest.getMe(),
  ]);
  const token = accessToken ?? null;

  if (!user || user.isBanned) {
    redirect("/login?redirect=/conversations");
  }

  const primaryRole =
    user.roles.find((role) => role.isPrimary)?.name ?? user.roles[0]?.name;

  if (primaryRole !== RoleName.CLIENT && primaryRole !== RoleName.FREELANCER) {
    redirect("/access-denied");
  }

  return (
    <div className="flex h-dvh flex-col bg-background font-sans">
      <div className="min-h-0 flex-1">
        <ConversationsShell
          socketUrl={getBrowserSocketUrl()}
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
