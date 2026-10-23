import { getTranslations } from "next-intl/server";
import authServerRequest from "@/apiRequests/auth.server";
import { NewConversationView } from "@/app/conversations/components/new-conversation-view";

type ClientNewConversationPageProps = {
  searchParams: Promise<{ participantId?: string }>;
};

const ClientNewConversationPage = async ({
  searchParams,
}: ClientNewConversationPageProps) => {
  const { participantId } = await searchParams;
  const participantIdNum = Number(participantId);
  const t = await getTranslations("chat");

  if (!participantId || isNaN(participantIdNum) || participantIdNum <= 0) {
    return (
      <div className="flex h-full items-center justify-center font-sans">
        <p className="text-muted-foreground text-sm">
          {t("invalidParticipant")}
        </p>
      </div>
    );
  }

  const user = await authServerRequest.getMe();
  const currentUserId = user?.id ?? null;

  return (
    <NewConversationView
      participantId={participantIdNum}
      currentUserId={currentUserId}
      basePath="/client"
    />
  );
};

export default ClientNewConversationPage;
