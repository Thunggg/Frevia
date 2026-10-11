"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, Plus, MessageSquare } from "lucide-react";
import { useCreateConversation } from "@/hooks/use-conversation";
import { toastError } from "@repo/ui/components/shadcn/toast";

type NewConversationDialogProps = {
  trigger?: ReactNode;
};

export function NewConversationDialog({
  trigger,
}: NewConversationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [participantId, setParticipantId] = useState("");

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
        router.push(`/conversations/${conversation.id}`);
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to start conversation";
        toastError({ message });
      },
    });
  }, [participantId, createConversation, router]);

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
            className="gap-1.5 bg-[#4fae2e] text-white hover:bg-[#459928]"
          >
            <Plus className="h-4 w-4" />
            New conversation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a conversation</DialogTitle>
          <DialogDescription>
            Open a private chat with another Frevia user. You’ll need their
            numeric user ID for now.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="participant-id">User ID</Label>
          <Input
            id="participant-id"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="e.g. 42"
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            disabled={createConversation.isPending}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Tip: open someone’s profile — the number in the URL (for example{" "}
            <span className="font-medium text-foreground">/profiles/42</span>)
            is their user ID.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={createConversation.isPending}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#4fae2e] text-white hover:bg-[#459928]"
            onClick={handleSubmit}
            disabled={!participantId.trim() || createConversation.isPending}
          >
            {createConversation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            Start chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
