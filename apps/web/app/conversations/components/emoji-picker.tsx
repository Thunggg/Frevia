"use client";

import { useEffect, useRef } from "react";
import { Smile } from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😉",
  "😎", "🤔", "😅", "😭", "😢", "😡", "😴", "🤯",
  "👍", "👎", "👏", "🙏", "💪", "✌️", "🤝", "👋",
  "❤️", "💖", "💔", "🔥", "✨", "🎉", "🎂", "🍕",
  "☕", "🌹", "🐶", "🐱", "🦊", "🐼", "🌈", "⭐",
];

type EmojiPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (emoji: string) => void;
};

export function EmojiPicker({
  open,
  onOpenChange,
  onSelect,
}: EmojiPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Pick emoji"
        onClick={() => onOpenChange(!open)}
        className="text-muted-foreground hover:text-foreground"
      >
        <Smile className="h-5 w-5" />
      </Button>
      {open && (
        <div className="absolute bottom-full right-0 z-50 mb-2 grid w-72 max-w-[80vw] grid-cols-8 gap-1 overflow-y-auto rounded-lg border bg-popover p-2 shadow-lg">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSelect(emoji)}
              className="flex aspect-square items-center justify-center rounded-md text-lg transition-colors hover:bg-accent"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
