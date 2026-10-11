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
    <div className={styles.skillsGrid}>
      {SKILLS.map((skill, index) => {
        const isFound = found.has(index);
        return (
          <span
            key={skill}
            className={`${styles.skillChip} ${
              isFound ? styles.skillFound : ""
            }`}
          >
            {skill}
          </span>
        );
      })}
    </div>
  );
}
