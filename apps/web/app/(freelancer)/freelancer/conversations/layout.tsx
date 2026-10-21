import { cookies } from "next/headers";
import type { ReactNode } from "react";
import authServerRequest from "@/apiRequests/auth.server";
import { envConfig } from "@/configs/validate-env";
import { ConversationsShell } from "@/app/conversations/components/conversations-shell";

export default async function FreelancerConversationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value ?? null;
  const user = await authServerRequest.getMe();

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 overflow-hidden">
      <ConversationsShell
        socketUrl={envConfig?.NESTJS_API_URL ?? ""}
        token={token}
        currentUserId={user?.id ?? null}
      >
        {children}
      </ConversationsShell>
    </div>
  );
}
