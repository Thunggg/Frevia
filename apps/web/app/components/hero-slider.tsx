"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./home-view.module.css";

const SLIDES = [
  {
    src: "/home/hero-photo.jpg",
    alt: "Home office desk with a plant and a laptop on a video call",
  },
  {
    src: "/home/hero-team.jpg",
    alt: "Freelancers collaborating and laughing around a shared table",
  },
  {
    src: "/home/hero-view.jpg",
    alt: "Remote worker at a desk overlooking a calm coastal landscape",
  },
] as const;

export const HERO_AUTO_MS = 5500;

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [cycle, setCycle] = useState(0);
  const remainingRef = useRef(HERO_AUTO_MS);

  const goTo = useCallback((next: number) => {
    remainingRef.current = HERO_AUTO_MS;
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
    setCycle((c) => c + 1);
  }, []);

  const prev = useCallback(() => goTo(index - 1), [goTo, index]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    remainingRef.current = HERO_AUTO_MS;
  }, [cycle]);

  useEffect(() => {
    if (paused || reducedMotion) return;

    const start = Date.now();
    const wait = remainingRef.current;
    const id = window.setTimeout(() => {
      remainingRef.current = HERO_AUTO_MS;
      setIndex((current) => (current + 1) % SLIDES.length);
      setCycle((c) => c + 1);
    }, wait);

    return () => {
      window.clearTimeout(id);
      remainingRef.current = Math.max(0, wait - (Date.now() - start));
    };
  }, [paused, reducedMotion, cycle]);

  return (
    <div
      className={styles.heroSlider}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div
        className={styles.heroSliderViewport}
        aria-roledescription="carousel"
      >
        {SLIDES.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={slide.src}
              className={`${styles.heroSlide} ${
                active ? styles.heroSlideActive : ""
              }`}
              aria-hidden={!active}
            >
              <Image
                key={active ? `live-${index}-${cycle}` : slide.src}
                src={slide.src}
                alt={slide.alt}
                width={1600}
                height={1000}
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 1024px"
                className={`${styles.heroPhoto} ${
                  active && !reducedMotion ? styles.heroPhotoLive : ""
                }`}
              />
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className={`${styles.heroSliderNav} ${styles.heroSliderNavPrev}`}
        onClick={prev}
        aria-label="Previous image"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        className={`${styles.heroSliderNav} ${styles.heroSliderNavNext}`}
        onClick={next}
        aria-label="Next image"
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>

      <div className={styles.heroSliderDots} role="tablist" aria-label="Slides">
        {SLIDES.map((slide, i) => {
          const active = i === index;
          return (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Show slide ${i + 1}`}
              className={`${styles.heroSliderDot} ${
                active ? styles.heroSliderDotActive : ""
              }`}
              onClick={() => goTo(i)}
            >
              {active && !reducedMotion ? (
                <span
                  key={`progress-${cycle}`}
                  className={styles.heroSliderDotProgress}
                  style={{
                    animationDuration: `${HERO_AUTO_MS}ms`,
                    animationPlayState: paused ? "paused" : "running",
                  }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
