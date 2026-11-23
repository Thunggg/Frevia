"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const SKILL_KEYS = [
  "uiDesign",
  "react",
  "branding",
  "copywriting",
  "illustration",
  "videoEdit",
  "seo",
  "mobileApps",
  "product",
  "marketing",
  "threeDArt",
  "voiceover",
  "wordpress",
  "dataViz",
  "motion",
] as const;

const FOUND_COUNT = 3;
const CYCLE_MS = 2800;

export function SkillsHighlight() {
  const t = useTranslations("home.skillsItems");
  const [offset, setOffset] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }

    const id = window.setInterval(() => {
      setOffset((current) => (current + FOUND_COUNT) % SKILL_KEYS.length);
    }, CYCLE_MS);

    return () => clearInterval(id);
  }, []);

  const found = new Set<number>();
  if (reduced) {
    for (let i = 0; i < FOUND_COUNT; i++) found.add(i);
  } else {
for (let i = 0; i < FOUND_COUNT; i++) {
        found.add((offset + i) % SKILL_KEYS.length);
      }
  }

  return (
    <div className="flex flex-wrap gap-2.5 sm:gap-3">
      {SKILL_KEYS.map((skillKey, index) => {
        const isFound = found.has(index);
        return (
          <span
            key={skillKey}
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
              isFound
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20 scale-105 dark:bg-blue-600 dark:text-white"
                : "bg-white/90 dark:bg-zinc-800/80 text-foreground/70 dark:text-zinc-300 border border-black/5 dark:border-white/10 hover:border-blue-600/30 dark:hover:border-blue-500/30 hover:text-foreground shadow-2xs"
            }`}
          >
            {t(skillKey)}
          </span>
        );
      })}
    </div>
  );
}
