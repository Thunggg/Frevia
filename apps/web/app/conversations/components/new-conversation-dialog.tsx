"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Loader2, Plus, MessageSquare } from "@/components/icons";
import { useCreateConversation } from "@/hooks/use-conversation";
import { toastError } from "@repo/ui/components/shadcn/toast";

type NewConversationDialogProps = {
  trigger?: ReactNode;
};

export function NewConversationDialog({
  trigger,
}: NewConversationDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [participantId, setParticipantId] = useState("");

  const basePath = pathname.startsWith("/client/conversations")
    ? "/client/conversations"
    : "/conversations";

  const createConversation = useCreateConversation();

  const handleSubmit = useCallback(() => {
    const id = Number(participantId);

    if (!Number.isInteger(id) || id <= 0) {
      toastError({ message: "Enter a whole number greater than zero." });
      return;
    }

    createConversation.mutate(id, {
      onSuccess: (conversation) => {
        setOpen(false);
        setParticipantId("");
        router.push(`${basePath}/${conversation.id}`);
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to start conversation";
        toastError({ message });
      },
    });
  }, [participantId, createConversation, router, basePath]);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setParticipantId("");
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            size="sm"
            className="rounded-full gap-1.5 bg-[#0069D3] text-white hover:bg-[#0058b3] text-xs font-semibold px-4 py-2 cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5" />
            New conversation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[26px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 shadow-2xl font-sans">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground font-sans">
            Start a conversation
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-sans">
            Open a private chat with another Frevia user. You’ll need their
            numeric user ID for now.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 my-2">
          <Label htmlFor="participant-id" className="text-xs font-semibold">
            User ID
          </Label>
          <Input
            id="participant-id"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="e.g. 42"
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            disabled={createConversation.isPending}
            className="rounded-full bg-[#F3F3F7] dark:bg-zinc-800/80 border border-black/5 dark:border-white/10 h-10 px-4 text-xs sm:text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Tip: open someone’s profile — the number in the URL (for example{" "}
            <span className="font-semibold text-foreground">/profiles/42</span>)
            is their user ID.
          </p>
        </div>

        <DialogFooter className="mt-2 flex gap-2">
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => setOpen(false)}
            disabled={createConversation.isPending}
          >
            Cancel
          </Button>
          <Button
            className="rounded-full bg-[#0069D3] text-white hover:bg-[#0058b3] text-xs font-semibold px-4"
            onClick={handleSubmit}
            disabled={!participantId.trim() || createConversation.isPending}
          >
            {createConversation.isPending ? (
              <Loader2 className="size-3.5 animate-spin mr-1.5" />
            ) : (
              <MessageSquare className="size-3.5 mr-1.5" />
            )}
            Start chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
