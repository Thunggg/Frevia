import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { envConfig } from "@/configs/validate-env";
import { getMeServer } from "@/lib/get-me";
import { ConversationsShell } from "./components/conversations-shell";

type ConversationsLayoutProps = {
  children: ReactNode;
};

const ConversationsLayout = async ({ children }: ConversationsLayoutProps) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value ?? null;
  const user = await getMeServer();

  return (
    <ConversationsShell
      socketUrl={envConfig?.NESTJS_API_URL ?? ""}
      token={token}
      currentUserId={user?.id ?? null}
    >
      {children}
    </ConversationsShell>
  );
};

export default ConversationsLayout;
