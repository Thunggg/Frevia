import { cookies } from "next/headers";
import type { ReactNode } from "react";

import authServerRequest from "@/apiRequests/auth.server";
import { Header, type UserRole } from "@/components/header";
import { envConfig } from "@/configs/validate-env";
import { RoleName } from "@shared/types";

import { ConversationsShell } from "./components/conversations-shell";

type ConversationsLayoutProps = {
  children: ReactNode;
};

function resolveHeaderRole(
  user: Awaited<ReturnType<typeof authServerRequest.getMe>>,
): UserRole {
  if (!user) return "GUEST";

  const primaryRole =
    user.roles.find((role) => role.isPrimary) ?? user.roles[0];

  if (primaryRole?.name === RoleName.CLIENT) return "CLIENT";
  if (primaryRole?.name === RoleName.FREELANCER) return "FREELANCER";

  return "FREELANCER";
}

const ConversationsLayout = async ({ children }: ConversationsLayoutProps) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value ?? null;
  const user = await authServerRequest.getMe();

  return (
    <div className="flex h-dvh flex-col bg-background font-sans">
      <Header role={resolveHeaderRole(user)} />
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
