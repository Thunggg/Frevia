"use client";

import { useState } from "react";
import { Send } from "lucide-react";

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

export function ContactDialog() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);

    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get("name"),
      email: form.get("email"),
      subject: form.get("subject"),
      message: form.get("message"),
    };

    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSent(true);
    } catch {
      // silently fail for now
    } finally {
      setSending(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setSent(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-foreground/60 transition-colors hover:bg-black/[0.04] hover:text-foreground dark:text-foreground/65 dark:hover:bg-white/[0.06]"
        >
          Contact
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Get in touch</DialogTitle>
          <DialogDescription>
            Send us a message and we&apos;ll get back to you shortly.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#4fae2e]/10">
              <Send className="size-5 text-[#4fae2e]" />
            </div>
            <p className="text-sm font-medium text-foreground">Message sent</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Thank you! We&apos;ll be in touch soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="contact-name"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  required
                  className="h-9 w-full rounded-lg border border-border/60 bg-white/60 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 transition-colors focus:border-[#4fae2e]/50 focus:ring-1 focus:ring-[#4fae2e]/20 dark:border-white/8 dark:bg-white/[0.03] dark:focus:border-[#4fae2e]/40 dark:focus:ring-[#4fae2e]/15"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="contact-email"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Email
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  className="h-9 w-full rounded-lg border border-border/60 bg-white/60 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 transition-colors focus:border-[#4fae2e]/50 focus:ring-1 focus:ring-[#4fae2e]/20 dark:border-white/8 dark:bg-white/[0.03] dark:focus:border-[#4fae2e]/40 dark:focus:ring-[#4fae2e]/15"
                  placeholder="you@email.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="contact-subject"
                className="text-xs font-medium text-muted-foreground"
              >
                Subject
              </label>
              <input
                id="contact-subject"
                name="subject"
                required
                className="h-9 w-full rounded-lg border border-border/60 bg-white/60 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 transition-colors focus:border-[#4fae2e]/50 focus:ring-1 focus:ring-[#4fae2e]/20 dark:border-white/8 dark:bg-white/[0.03] dark:focus:border-[#4fae2e]/40 dark:focus:ring-[#4fae2e]/15"
                placeholder="How can we help?"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="contact-message"
                className="text-xs font-medium text-muted-foreground"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={4}
                className="w-full resize-none rounded-lg border border-border/60 bg-white/60 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 transition-colors focus:border-[#4fae2e]/50 focus:ring-1 focus:ring-[#4fae2e]/20 dark:border-white/8 dark:bg-white/[0.03] dark:focus:border-[#4fae2e]/40 dark:focus:ring-[#4fae2e]/15"
                placeholder="Tell us more..."
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={sending}
                className="h-9 rounded-lg bg-[#4fae2e] px-5 text-[13px] font-semibold text-white shadow-sm shadow-[#4fae2e]/20 hover:bg-[#459928] disabled:opacity-50 dark:hover:bg-[#5bc03a]"
              >
                {sending ? "Sending..." : "Send message"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
