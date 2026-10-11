"use client";

import { useEffect, useState } from "react";

import styles from "./home-view.module.css";

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

/** How many skills appear “found” at once */
const FOUND_COUNT = 3;
const CYCLE_MS = 2400;

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

    return () => window.clearInterval(id);
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
    <ul className={styles.skillsGrid} aria-label="Freelance skill categories">
      {SKILLS.map((skill, index) => {
        const isFound = found.has(index);
        return (
          <li key={skill}>
            <span
              className={`${styles.skillChip} ${
                isFound ? styles.skillFound : ""
              }`}
            >
              {skill}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
