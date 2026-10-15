"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { PostJobForm } from "@/app/(client)/client/jobs/_components/post-job-form";

export function PostJobPageContent() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <main className="flex-1">
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
            <nav className="flex items-center gap-2 text-xs text-muted-foreground font-medium font-sans">
              <Link
                href="/client/jobs"
                className="transition-colors hover:text-[#0069D3]"
              >
                My Jobs
              </Link>
              <span className="text-muted-foreground/40">/</span>
              <span className="font-semibold text-foreground">Post a Job</span>
            </nav>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-xs">
            <PostJobForm
              mode="page"
              onSaved={() => router.push("/client/jobs")}
              onCancel={() => router.push("/client/jobs")}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
