"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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

const AUTO_MS = 5500;

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  const prev = useCallback(() => goTo(index - 1), [goTo, index]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, AUTO_MS);

    return () => window.clearInterval(id);
  }, [paused]);

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
      <div className={styles.heroSliderViewport} aria-roledescription="carousel">
        <div
          className={styles.heroSliderTrack}
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={slide.src}
              className={styles.heroSlide}
              aria-hidden={i !== index}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                width={1600}
                height={1000}
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 1024px"
                className={styles.heroPhoto}
              />
            </div>
          ))}
        </div>
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
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Show slide ${i + 1}`}
            className={`${styles.heroSliderDot} ${
              i === index ? styles.heroSliderDotActive : ""
            }`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
