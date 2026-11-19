"use client";

import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Smile } from "@/components/icons";
import { Button } from "@repo/ui/components/shadcn/button";

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😉",
  "😎", "🤔", "😅", "😭", "😢", "😡", "😴", "🤯",
  "👍", "👎", "👏", "🙏", "💪", "✌️", "🤝", "👋",
  "❤️", "💖", "💔", "🔥", "✨", "🎉", "🎂", "🍕",
  "☕", "🌹", "🐶", "🐱", "🦊", "🐼", "🌈", "⭐",
];

const VIEWPORT_PADDING = 8;
const POPUP_GAP = 4;
const POPUP_WIDTH = 288;
const POPUP_MAX_HEIGHT = 248;
const POPUP_MIN_HEIGHT = 160;
const POPUP_DOWN_OFFSET = 50;

type PopupPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

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
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<PopupPosition | null>(null);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("chat");

  useEffect(() => setMounted(true), []);

  const updatePosition = useCallback(() => {
    const trigger = rootRef.current?.querySelector("button");
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.min(
      POPUP_WIDTH,
      window.innerWidth - VIEWPORT_PADDING * 2,
    );
    const spaceAbove = rect.top - VIEWPORT_PADDING - POPUP_GAP;
    const spaceBelow =
      window.innerHeight - rect.bottom - VIEWPORT_PADDING - POPUP_GAP;
    const preferTop =
      spaceAbove >= Math.min(POPUP_MAX_HEIGHT, POPUP_MIN_HEIGHT) ||
      spaceAbove >= spaceBelow;
    const availableSpace = preferTop ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(
      0,
      Math.min(POPUP_MAX_HEIGHT, availableSpace) -
        (preferTop ? POPUP_DOWN_OFFSET : 0),
    );
    const top = preferTop
      ? rect.top - POPUP_GAP - maxHeight
      : rect.bottom + POPUP_GAP;
    const left = Math.min(
      Math.max(rect.right - width, VIEWPORT_PADDING),
      Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING),
    );

    setPosition({ top, left, width, maxHeight });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        popupRef.current?.contains(target)
      ) {
        return;
      }
      onOpenChange(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={t("pickEmoji")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="text-muted-foreground hover:text-foreground"
      >
        <Smile className="h-5 w-5" />
      </Button>

      {open && mounted && position
        ? createPortal(
            <div
              ref={popupRef}
              role="dialog"
              aria-label={t("pickEmoji")}
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                width: position.width,
                maxHeight: position.maxHeight,
              }}
              className="z-[100] grid grid-cols-8 gap-1 overflow-y-auto rounded-lg border bg-popover p-2 shadow-lg"
            >
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
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
