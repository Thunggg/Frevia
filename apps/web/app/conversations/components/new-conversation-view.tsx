"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Send } from "@/components/icons";
import Link from "next/link";
import { useCreateConversation } from "@/hooks/use-conversation";
import { accountProfileApi } from "@/apiRequests/account-profile";
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
}: NewConversationViewProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [participantName, setParticipantName] = useState<string | null>(null);
  const [participantAvatar, setParticipantAvatar] = useState<string | null>(null);
  const [loadingParticipant, setLoadingParticipant] = useState(true);
  const createConversation = useCreateConversation();

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
    <div className="flex h-full flex-col bg-background font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-background/80 backdrop-blur px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/conversations"
            className="flex size-8 items-center justify-center rounded-full bg-[#F1F0F5] dark:bg-zinc-800 text-muted-foreground hover:text-foreground md:hidden shrink-0 cursor-pointer"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <Avatar className="size-10 shrink-0">
            <AvatarImage src={participantAvatar ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-muted text-xs font-bold text-foreground">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-foreground font-sans">
              {loadingParticipant ? "Loading..." : displayName}
            </h3>
            <p className="text-[11px] text-muted-foreground font-normal">
              New conversation
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="text-center">
          <Avatar className="mx-auto size-16">
            <AvatarImage src={participantAvatar ?? undefined} alt={displayName} />
            <AvatarFallback className="text-xl font-bold bg-muted text-foreground">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="mt-3 text-base font-bold text-foreground font-sans">
            {loadingParticipant ? "Loading..." : displayName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Send a message to start the conversation
          </p>
        </div>
      </div>

      {/* Modern Capsule Input */}
      <div className="border-t border-border bg-background/95 backdrop-blur p-3 sm:p-4">
        <form
          className="flex items-center gap-2 rounded-full border border-black/5 dark:border-white/10 bg-[#F3F3F7] dark:bg-zinc-800/80 px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#0069D3]/30 transition-all"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            placeholder="Type your first message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm font-sans text-foreground placeholder:text-muted-foreground px-2 py-1"
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim() || createConversation.isPending}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0069D3] text-white hover:bg-[#0058b3] disabled:opacity-30 disabled:hover:bg-[#0069D3] transition-all cursor-pointer shadow-xs outline-none"
          >
            {createConversation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
