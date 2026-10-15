/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import Link from "next/link";

export function HeroSlider() {

  return (
    <div className="mx-auto max-w-8xl px-4 pt-4 pb-12 sm:px-6 lg:px-8">
      <div className="relative flex min-h-[580px] w-full flex-col justify-between overflow-visible rounded-[28px] bg-zinc-900 p-6 sm:rounded-[36px] sm:p-10 lg:min-h-[640px] lg:p-14 shadow-2xl">
        {/* Background Image & Atmospheric Overlays */}
        <div className="absolute inset-0 overflow-hidden rounded-[28px] sm:rounded-[36px]">
          <Image
            src="/banner/image.png"
            alt="Freelance Marketplace Banner"
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-center scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/60" />
          <div className="absolute inset-0 bg-radial from-transparent via-black/30 to-black/70" />
        </div>

        {/* ── Top / Center: Headline & Direct CTAs ── */}
        <div className="relative z-10 mx-auto mt-4 flex w-full max-w-4xl flex-col items-center text-center sm:mt-8">
          {/* Badge */}
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-300/30 bg-green-300/10 px-3.5 py-1 text-xs font-medium text-green-300 backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-green-300 animate-pulse" />
            Top 3% Vetted Talent Network
          </span>

          {/* Headline */}
          <h1
            className="font-extrabold tracking-tight text-white select-none"
            style={{
              fontSize: "clamp(42px, 8vw, 84px)",
              lineHeight: 1.05,
              textShadow: "0 8px 30px rgba(0,0,0,0.6)",
            }}
          >
            Hire world-class <br className="hidden sm:inline" />
            freelance talent.
          </h1>

          {/* Subtitle */}
          <p className="mt-4 max-w-2xl text-sm font-normal text-white/80 sm:text-lg drop-shadow-md">
            Connect with top developers, designers, and marketers. Scale your dream team on-demand with secure milestone payments.
          </p>

          {/* Call To Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/find-talent"
              className="rounded-full bg-green-300 px-6 py-3 text-xs sm:text-sm font-semibold text-zinc-950 transition-all hover:bg-green-200 hover:shadow-[0_0_20px_rgba(134,239,172,0.45)] hover:scale-105"
            >
              Hire Top Talent
            </Link>
            <Link
              href="/find-work"
              className="rounded-full border border-white/25 bg-white/10 px-6 py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/40"
            >
              Apply as Freelancer
            </Link>
          </div>
        </div>

        {/* ── Bottom: Social Proof & Platform Metrics ── */}
        <div className="relative z-10 mt-10 flex flex-col justify-between gap-6 border-t border-white/10 pt-6 sm:flex-row sm:items-end">
          {/* Bottom Left: Vetted Community Stats */}
          <div className="max-w-sm space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 overflow-hidden">
                <img
                  className="inline-block size-8 rounded-full ring-2 object-cover"
                  src="https://i.pinimg.com/1200x/6d/10/c3/6d10c39c28732a13a03c99c7245878d1.jpg"
                  alt="Avatar 1"
                />
                <img
                  className="inline-block size-8 rounded-full ring-2 object-cover"
                  src="https://i.pinimg.com/736x/06/52/bf/0652bfda4c1b457989e013ebca7e3f8f.jpg"
                  alt="Avatar 2"
                />
                <img
                  className="inline-block size-8 rounded-full ring-2 object-cover"
                  src="https://i.pinimg.com/1200x/49/1a/38/491a381ccbb6ea8306d8d4b014555d54.jpg"
                  alt="Avatar 3"
                />
              </div>
              <div>
                <p className="text-sm font-bold tracking-wide text-white">5,000+ Active Experts</p>
                <div className="flex text-amber-400 text-xs tracking-tighter">★★★★★</div>
              </div>
            </div>

            <p className="text-xs text-white/60">
              Trusted by tech startups and leading global agencies worldwide.
            </p>
          </div>

          {/* Bottom Right: Job Success Rate Metric */}
          <div className="flex flex-col items-start sm:items-end">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                98.5%
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                Job Success Score
              </span>
            </div>

            {/* Progress indicator */}
            <div className="mt-2 w-44 sm:w-52">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-[98.5%] rounded-full bg-green-300 shadow-[0_0_12px_rgba(134,239,172,0.6)]" />
              </div>
              <p className="mt-1.5 text-right text-[10px] text-white/40">Across 12,000+ completed contracts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}