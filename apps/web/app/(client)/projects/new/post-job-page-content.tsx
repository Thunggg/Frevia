"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@repo/ui/components/shadcn/button";

import { PostJobForm } from "../post-job-form";

export function PostJobPageContent() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header role="CLIENT" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" asChild className="-ml-2 mb-4">
          <Link href="/projects">
            <ArrowLeft className="mr-2 size-4" />
            Back to My Jobs
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Post a Job</h1>
        <p className="mt-1 text-muted-foreground">
          Describe the work and publish it for freelancers to find.
        </p>
        <div className="mt-8 rounded-xl border border-border p-6">
          <PostJobForm
            mode="page"
            onSaved={() => router.push("/projects")}
            onCancel={() => router.push("/projects")}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
