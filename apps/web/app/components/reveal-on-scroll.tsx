"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import styles from "./home-view.module.css";

type RevealOnScrollProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms once visible */
  delayMs?: number;
};

export function RevealOnScroll({
  children,
  className = "",
  delayMs = 0,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const classes = [
    styles.scrollReveal,
    visible ? styles.scrollVisible : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties | undefined =
    delayMs > 0
      ? {
          transitionDelay: visible ? `${delayMs}ms` : "0ms",
        }
      : undefined;

  return (
    <div ref={ref} className={classes} style={style}>
      {children}
    </div>
  );
}
