"use client";

import { useState } from "react";
import { BookmarkPlus } from "lucide-react";

import savedSearchApiRequest from "@/apiRequests/saved-search";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";

type SaveSearchDialogProps = {
  searchParams: Record<string, string>;
  onCreated?: () => void;
};

export function SaveSearchDialog({
  searchParams,
  onCreated,
}: SaveSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);
    try {
      await savedSearchApiRequest.create({
        name: trimmedName,
        searchParams,
      });
      toastSuccess({ message: "Search saved" });
      setName("");
      setOpen(false);
      onCreated?.();
    } catch {
      toastError({ message: "Couldn't save this search. Try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-10 gap-2">
          <BookmarkPlus className="size-4" />
          Save search
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save this search</DialogTitle>
          <DialogDescription>
            Give this filter set a name so you can return to it anytime.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="saved-search-name">Search name</Label>
            <Input
              id="saved-search-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="For example, Remote React work"
              maxLength={100}
              autoFocus
              required
            />
            <p className="text-xs text-muted-foreground">
              Your current keyword, budget, date, and sort filters will be saved.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="bg-[#4fae2e] text-white hover:bg-[#459928]"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? "Saving..." : "Save search"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
