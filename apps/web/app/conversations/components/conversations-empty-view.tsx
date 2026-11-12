import { getTranslations } from "next-intl/server";
import { MessageSquare } from "@/components/icons";
import { UserIdAutoRedirect } from "./user-id-auto-redirect";

type ConversationsEmptyViewProps = {
  userId?: string;
};

export const ConversationsEmptyView = async ({
  userId,
}: ConversationsEmptyViewProps) => {
  const t = await getTranslations("chat");
  const targetUserId = userId ? Number(userId) : null;

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-4 px-6 text-center font-sans">
      {targetUserId && targetUserId > 0 ? (
        <UserIdAutoRedirect targetUserId={targetUserId} />
      ) : null}

      <div className="flex size-14 items-center justify-center rounded-full bg-[#F1F0F5] dark:bg-zinc-800 text-muted-foreground">
        <MessageSquare className="size-6 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
          {t("yourMessages")}
        </h1>
        <p className="mt-1.5 max-w-sm text-xs font-normal text-muted-foreground leading-relaxed">
          {t("selectConversation")}
        </p>
      </div>
    </div>
  );
};
