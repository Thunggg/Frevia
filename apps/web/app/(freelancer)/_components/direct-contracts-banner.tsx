"use client";

import Link from "next/link";
import { useState } from "react";
import { Pause, Play } from "@/components/icons";

export function DirectContractsBanner() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#141414] dark:bg-zinc-900 text-white p-6 sm:p-8 font-sans shadow-md">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left Text & CTA */}
        <div className="space-y-3 max-w-xl z-10">
          <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            Direct Contracts
          </p>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-snug">
            Maximize your earnings with a low 5% service fee when you bring new
            clients to Frevia.
          </h2>
          <div className="pt-2">
            <Link
              href="/freelancer/contracts"
              className="inline-flex items-center rounded-full bg-white text-zinc-950 hover:bg-zinc-100 px-5 py-2.5 text-xs sm:text-sm font-semibold transition-colors shadow-sm"
            >
              Create contract
            </Link>
          </div>
        </div>

        {/* Right Graphic / Contract Document Illustration */}
        <div className="relative shrink-0 flex items-center justify-center self-center md:self-auto">
          <div className="w-36 h-28 sm:w-44 sm:h-36 relative flex items-center justify-center">
            {/* Phone Body */}
            <div className="w-16 h-28 sm:w-20 sm:h-32 rounded-xl bg-zinc-800 border-2 border-zinc-700/80 shadow-lg flex flex-col items-center justify-between p-1.5 transform -rotate-6">
              <div className="w-3 h-1 rounded-full bg-zinc-600" />
              <div className="w-full flex-1 bg-zinc-900/90 rounded-md my-1 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
              </div>
              <div className="w-2 h-2 rounded-full border border-zinc-600" />
            </div>

            {/* Document Paper */}
            <div className="absolute left-10 sm:left-12 -top-2 w-24 sm:w-28 h-32 sm:h-36 rounded-lg bg-zinc-100 dark:bg-zinc-200 text-zinc-900 p-3 shadow-xl transform rotate-3 flex flex-col justify-between">
              <div className="space-y-1.5 pt-1">
                <div className="w-8 h-1.5 rounded-full bg-zinc-400" />
                <div className="w-full h-1 rounded-full bg-zinc-300" />
                <div className="w-4/5 h-1 rounded-full bg-zinc-300" />
                <div className="w-3/4 h-1 rounded-full bg-zinc-300" />
              </div>

              {/* Seal Stamp */}
              <div className="flex justify-end pr-1 pb-1">
                <div className="size-5 rounded-full bg-amber-400 shadow-xs flex items-center justify-center text-[8px] font-bold text-amber-950">
                  ★
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Dots / Progress at bottom center */}
      <div className="mt-6 flex items-center justify-center gap-2 pt-2 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="text-zinc-500 hover:text-white transition-colors cursor-pointer mr-1"
          title={isPlaying ? "Pause carousel" : "Play carousel"}
        >
          {isPlaying ? (
            <Pause className="size-3" />
          ) : (
            <Play className="size-3" />
          )}
        </button>

        {[0, 1, 2, 3, 4].map((index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveSlide(index)}
            className={`h-1 rounded-full transition-all cursor-pointer ${
              activeSlide === index
                ? "w-8 bg-white"
                : "w-5 bg-zinc-700 hover:bg-zinc-500"
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

