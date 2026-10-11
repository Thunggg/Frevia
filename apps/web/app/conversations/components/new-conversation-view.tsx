"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useCreateConversation } from "@/hooks/use-conversation";
import { accountProfileApi } from "@/apiRequests/account-profile";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@repo/ui/components/shadcn/avatar";
import { toastError } from "@repo/ui/components/shadcn/toast";

type NewConversationViewProps = {
  participantId: number;
  currentUserId: number | null;
};

export function NewConversationView({
  participantId,
  currentUserId,
}: NewConversationViewProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [participantName, setParticipantName] = useState<string | null>(null);
  const [participantAvatar, setParticipantAvatar] = useState<string | null>(null);
  const [loadingParticipant, setLoadingParticipant] = useState(true);
  const createConversation = useCreateConversation();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      setLoadingParticipant(true);
      try {
        const response = await accountProfileApi.getClientProfile(participantId);
        if (!active) return;
        setParticipantName(
          response.data.clientProfile.companyName ??
            response.data.displayName ??
            `User #${participantId}`
        );
        setParticipantAvatar(response.data.avatarUrl ?? null);
      } catch {
        if (!active) return;
        setParticipantName(`User #${participantId}`);
      } finally {
        if (active) setLoadingParticipant(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [participantId]);

  const displayName = participantName ?? `User #${participantId}`;

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    createConversation.mutate(participantId, {
      onSuccess: (conversation) => {
        router.push(`/conversations/${conversation.id}`);
      },
      onError: (error) => {
        toastError({
          message: error.message || "Failed to start conversation",
        });
      },
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-[#eaf8df]/50 px-4 py-3 dark:bg-muted/60">
        <Link
          href="/conversations"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#4fae2e] transition-colors hover:text-[#3f9225] md:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <Avatar>
          <AvatarImage src={participantAvatar ?? undefined} alt={displayName} />
          <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {loadingParticipant ? "Loading..." : displayName}
          </p>
          <p className="text-xs text-muted-foreground">
            Start a conversation
          </p>
        </div>
      </div>

      {/* Empty state */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="text-center">
          <Avatar className="mx-auto h-16 w-16">
            <AvatarImage src={participantAvatar ?? undefined} alt={displayName} />
            <AvatarFallback className="text-xl">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="mt-4 text-lg font-medium text-foreground">
            {loadingParticipant ? "Loading..." : displayName}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Send a message to start the conversation
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Input
            placeholder="Type your first message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || createConversation.isPending}
            className="shrink-0 !bg-[#4fae2e] !text-white hover:!bg-[#459928] disabled:!bg-[#4fae2e]/50 disabled:!text-white"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
