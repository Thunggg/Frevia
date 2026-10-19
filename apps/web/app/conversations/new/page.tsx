import { redirect } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { NewConversationView } from "../components/new-conversation-view";

type NewConversationPageProps = {
  searchParams: Promise<{ participantId?: string }>;
};

const NewConversationPage = async ({ searchParams }: NewConversationPageProps) => {
  const { participantId } = await searchParams;
  const participantIdNum = Number(participantId);

  if (!participantId || isNaN(participantIdNum) || participantIdNum <= 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Invalid participant</p>
      </div>
    );
  }

  const user = await authServerRequest.getMe();
  const primaryRole =
    user?.roles.find((role) => role.isPrimary)?.name ?? user?.roles[0]?.name;

  if (primaryRole === RoleName.CLIENT) {
    redirect(`/client/conversations/new?participantId=${participantId}`);
  }

  if (primaryRole === RoleName.FREELANCER) {
    redirect(`/freelancer/conversations/new?participantId=${participantId}`);
  }

  const currentUserId = user?.id ?? null;

  return (
    <NewConversationView
      participantId={participantIdNum}
      currentUserId={currentUserId}
    />
  );
};

export default NewConversationPage;
