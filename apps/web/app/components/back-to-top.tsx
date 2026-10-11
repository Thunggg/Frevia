"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-50 flex size-11 items-center justify-center rounded-full border border-border/40 bg-background/80 text-foreground/60 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-[#4fae2e]/30 hover:bg-[#4fae2e]/5 hover:text-[#4fae2e] hover:shadow-xl dark:border-white/10 dark:bg-white/[0.06] dark:text-foreground/50 dark:hover:border-[#4fae2e]/30 dark:hover:bg-[#4fae2e]/10 dark:hover:text-[#5bc03a] ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
      aria-label="Back to top"
    >
      <ArrowUp className="size-4.5" strokeWidth={2} />
    </button>
  );
}
