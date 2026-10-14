"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

import { PostJobForm } from "../post-job-form";

export function PostJobPageContent() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role="CLIENT" />

      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="transition-colors hover:text-[#4fae2e]">
                Home
              </Link>
              <span className="mx-2 text-foreground/35">/</span>
              <Link
                href="/client/jobs"
                className="transition-colors hover:text-[#4fae2e]"
              >
                My Jobs
              </Link>
              <span className="mx-2 text-foreground/35">/</span>
              <span className="font-medium text-foreground">Post a Job</span>
            </nav>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Post a Job
            </h1>
            <p className="mt-2 max-w-[42ch] text-base text-foreground/70 dark:text-foreground/75">
              Describe the work and publish it for freelancers to find.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="rounded-xl border border-border p-5 sm:p-8">
            <PostJobForm
              mode="page"
              onSaved={() => router.push("/client/jobs")}
              onCancel={() => router.push("/client/jobs")}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
