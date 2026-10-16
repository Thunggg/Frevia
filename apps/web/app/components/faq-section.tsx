"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "@/components/icons";
import { RevealOnScroll } from "./reveal-on-scroll";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How does Frevia ensure the quality of freelancers?",
    answer:
      "All freelancers on Frevia undergo profile verification, portfolio assessments, and peer reviews. Clients can inspect work history, verified skills, and genuine client ratings before making any hiring decisions.",
  },
  {
    question: "How does payment protection and escrow work?",
    answer:
      "Payments are securely deposited into escrow at the start of each project milestone. Funds are only released to the freelancer once the client reviews and approves the submitted work, ensuring 100% protection for both parties.",
  },
  {
    question: "What are the fees for clients and freelancers?",
    answer:
      "Posting a job and browsing talent is completely free for clients. We charge a transparent, low platform service fee upon milestone release with zero hidden fees. Freelancers keep up to 90% of their contract value.",
  },
  {
    question: "How quickly can I hire someone for my project?",
    answer:
      "Most job posts receive proposals within hours. If you choose to hire directly from the Discover or Marketplace page, you can initiate a conversation and send an offer contract immediately.",
  },
  {
    question: "Can I collaborate or hire a whole team for a large contract?",
    answer:
      "Yes! Through our Community Forum and multi-seat client accounts, you can hire cross-functional squads (designers, engineers, product managers) to deliver complex enterprise deliverables seamlessly.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section className="border-b border-border/40 bg-background/50 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <RevealOnScroll>
          <div className="text-center">
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>
        </RevealOnScroll>

        <div className="mt-12 space-y-3.5">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <RevealOnScroll key={item.question} delayMs={index * 40}>
                <div
                  className={`rounded-2xl transition-all duration-200 ${isOpen
                    ? "border-green-800/30 bg-card shadow-xs dark:border-green-500/30 dark:bg-zinc-900/80"
                    : "border-border/60 bg-card/60 hover:border-border dark:border-white/10 dark:bg-zinc-900/40"
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(index)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6 cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-semibold text-foreground sm:text-lg">
                      {item.question}
                    </span>
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${isOpen
                        ? "bg-green-300 text-white rotate-180 dark:bg-green-300"
                        : "bg-green-300 text-white text-muted-foreground"
                        }`}
                    >
                      <ChevronDown className="size-4" />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
                      <p className="border-t border-border/50 pt-4 text-sm sm:text-base leading-relaxed text-muted-foreground dark:border-white/5">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              </RevealOnScroll>
            );
          })}
        </div>

        <RevealOnScroll delayMs={240}>
          <div className="mt-10 text-center text-sm text-muted-foreground">
            Still have questions?{" "}
            <Link
              href="/forum"
              className="font-semibold text-green-800 underline decoration-green-800/40 underline-offset-4 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
            >
              Ask the community on our forum
            </Link>{" "}
            or check our help center.
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
