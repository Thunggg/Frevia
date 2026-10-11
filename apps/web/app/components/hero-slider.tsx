"use client";

import Image from "next/image";
import Link from "next/link";
import { Fraunces } from "next/font/google";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./home-view.module.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-home-display",
  display: "swap",
});

const SLIDES = [
  {
    src: "/home/hero-photo.jpg",
    alt: "Home office desk with a plant and a laptop on a video call",
    headline: "Where great work begins",
    subtext: "A curated marketplace connecting talented freelancers with visionary clients.",
    cta: { label: "Get started", href: "/find-work" },
  },
  {
    src: "/home/hero-team.jpg",
    alt: "Freelancers collaborating and laughing around a shared table",
    headline: "Hire with confidence",
    subtext: "Find vetted professionals across design, development, marketing and more.",
    cta: { label: "Find talent", href: "/find-work" },
  },
  {
    src: "/home/hero-view.jpg",
    alt: "Remote worker at a desk overlooking a calm coastal landscape",
    headline: "Work on your terms",
    subtext: "Browse projects, set your schedule, and build a career that fits your life.",
    cta: { label: "Browse projects", href: "/find-work" },
  },
] as const;

export const HERO_AUTO_MS = 6000;

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

  const slide = SLIDES[index]!;

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
        {SLIDES.map((s, i) => {
          const active = i === index;
          return (
            <div
              key={s.src}
              className={`${styles.heroSlide} ${
                active ? styles.heroSlideActive : ""
              }`}
              aria-hidden={!active}
            >
              <Image
                key={active ? `live-${index}-${cycle}` : s.src}
                src={s.src}
                alt={s.alt}
                width={1920}
                height={1080}
                priority={i === 0}
                sizes="100vw"
                className={`${styles.heroPhoto} ${
                  active && !reducedMotion ? styles.heroPhotoLive : ""
                }`}
              />
            </div>
          );
        })}

        {/* Text overlay */}
        <div className={styles.heroOverlay}>
          <div
            key={`text-${index}-${cycle}`}
            className={styles.heroText}
          >
            <h2
              className={`${display.variable} ${styles.heroHeadline}`}
            >
              {slide.headline}
            </h2>
            <p className={styles.heroSubtext}>
              {slide.subtext}
            </p>
            <Link
              href={slide.cta.href}
              className={styles.heroCta}
            >
              {slide.cta.label}
              <ChevronRight className="size-4" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>

      <button
        type="button"
        className={`${styles.heroSliderNav} ${styles.heroSliderNavPrev}`}
        onClick={prev}
        aria-label="Previous image"
      >
        <ChevronLeft className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        className={`${styles.heroSliderNav} ${styles.heroSliderNavNext}`}
        onClick={next}
        aria-label="Next image"
      >
        <ChevronRight className="size-4" aria-hidden />
      </button>

      <div className={styles.heroSliderDots} role="tablist" aria-label="Slides">
        {SLIDES.map((s, i) => {
          const active = i === index;
          return (
            <button
              key={s.src}
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
