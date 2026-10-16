"use client";

import { useEffect, useState } from "react";

const SKILLS = [
  "UI Design",
  "React",
  "Branding",
  "Copywriting",
  "Illustration",
  "Video Edit",
  "SEO",
  "Mobile Apps",
  "Product",
  "Marketing",
  "3D Art",
  "Voiceover",
  "WordPress",
  "Data Viz",
  "Motion",
] as const;

const FOUND_COUNT = 3;
const CYCLE_MS = 2800;

export function SkillsHighlight() {
  const [offset, setOffset] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }

    const id = window.setInterval(() => {
      setOffset((current) => (current + FOUND_COUNT) % SKILLS.length);
    }, CYCLE_MS);

    return () => clearInterval(id);
  }, []);

  const found = new Set<number>();
  if (reduced) {
    for (let i = 0; i < FOUND_COUNT; i++) found.add(i);
  } else {
    for (let i = 0; i < FOUND_COUNT; i++) {
      found.add((offset + i) % SKILLS.length);
    }
  }

  return (
    <div className="flex flex-wrap gap-2.5 sm:gap-3">
      {SKILLS.map((skill, index) => {
        const isFound = found.has(index);
        return (
          <span
            key={skill}
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
              isFound
                ? "bg-green-300 text-green-900 shadow-sm shadow-green-800/10 scale-105 dark:bg-green-500/20 dark:text-green-300 dark:border dark:border-green-500/30"
                : "bg-white/90 dark:bg-zinc-800/80 text-foreground/70 dark:text-zinc-300 border border-black/5 dark:border-white/10 hover:border-green-800/30 dark:hover:border-green-500/30 hover:text-foreground shadow-2xs"
            }`}
          >
            {skill}
          </span>
        );
      })}
    </div>
  );
}
