"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bookmark,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
} from "lucide-react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import jobApiRequest from "@/apiRequests/job";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import type { ViewJobDetailResType } from "@shared/types";

type JobDetailContentProps = {
  job: ViewJobDetailResType;
  initialIsBookmarked: boolean;
};

function formatBudget(job: ViewJobDetailResType) {
  if (job.budgetMin === null || job.budgetMax === null) {
    return "Negotiable";
  }

  return `$${job.budgetMin} - $${job.budgetMax}`;
}

function formatDate(value: string | Date | null) {
  if (!value) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatPostedTime(value: string | Date) {
  const hours = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / (60 * 60 * 1000)),
  );

  if (hours < 24) {
    return `Posted ${hours || "just"} ${hours ? "hours" : "now"} ago`;
  }

  return `Posted ${Math.floor(hours / 24)} days ago`;
}

export function JobDetailContent({ job, initialIsBookmarked }: JobDetailContentProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const clientDetails = [
    ["Jobs Posted", "Not available"],
    ["Hire Rate", "Not available"],
    ["Total Spent", "Not available"],
    ["Member Since", "Not available"],
  ];

  const toggleBookmark = async () => {
    if (isBookmarked) {
      setIsRemoveDialogOpen(true);
      return;
    }

    setIsBookmarkLoading(true);

    try {
      await jobApiRequest.bookmarkJob(job.id);
      setIsBookmarked(true);
      toastSuccess({ message: "Job saved to bookmarks" });
    } catch {
      toastError({ message: "Unable to update bookmark. Please try again." });
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const removeBookmark = async () => {
    setIsBookmarkLoading(true);
    try {
      await jobApiRequest.removeBookmark(job.id);
      setIsBookmarked(false);
      setIsRemoveDialogOpen(false);
      toastSuccess({ message: "Bookmark removed" });
    } catch {
      toastError({ message: "Unable to remove bookmark. Please try again." });
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header role="FREELANCER" />

      <main className="flex-1">
        <section className="border-b bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
              <nav className="flex min-w-0 items-center gap-2">
                <Link href="/" className="hover:text-foreground">
                  Home
                </Link>
                <span>/</span>
                <Link href="/find-work" className="hover:text-foreground">
                  Find Work
                </Link>
                <span>/</span>
                <span className="truncate text-foreground">{job.title}</span>
              </nav>
              <Link
                href="/find-work"
                className="shrink-0 hover:text-foreground"
              >
                ← Back to Jobs
              </Link>
            </div>

            <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <div className="mb-4 flex flex-wrap gap-2">
                  {job.featured && <Badge>Featured</Badge>}
                  <Badge variant="outline">{job.budgetType.replaceAll("_", " ")}</Badge>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {job.title}
                </h1>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4" /> Remote (Worldwide)
                  </span>
                  <span className="flex items-center gap-1.5 text-primary">
                    <DollarSign className="size-4" /> {formatBudget(job)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building2 className="size-4" /> Client #{job.clientId}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" /> {formatPostedTime(job.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5 text-destructive">
                    <CalendarDays className="size-4" /> Deadline: {formatDate(job.deadline)}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  size="icon"
                  variant={isBookmarked ? "default" : "outline"}
                  aria-label={isBookmarked ? "Remove bookmark" : "Save job"}
                  disabled={isBookmarkLoading}
                  onClick={toggleBookmark}
                >
                  <Bookmark className={isBookmarked ? "size-4 fill-current" : "size-4"} />
                </Button>
                <Button>Apply Now</Button>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
          <article className="lg:col-span-2">
            <section>
              <h2 className="text-2xl font-bold">Job Description</h2>
              <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">
                {job.description ?? "No description provided yet."}
              </p>
            </section>

            <section className="mt-10">
              <h3 className="text-sm font-bold uppercase tracking-wide">
                Skills Required
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.skills.length ? (
                  job.skills.map((skill) => (
                    <Badge key={skill.skillId} variant="secondary">
                      <CheckCircle2 className="mr-1 size-3.5" />
                      {skill.skill.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No skills specified.
                  </p>
                )}
              </div>
            </section>
          </article>

          <aside>
            <Card className="sticky top-24 border-border shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-xl">About the Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-14 items-center justify-center rounded-lg border bg-secondary text-primary">
                    <Building2 className="size-7" />
                  </div>
                  <div>
                    <p className="font-semibold">Client #{job.clientId}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Client information is limited
                    </p>
                  </div>
                </div>

                <dl className="divide-y border-y">
                  {clientDetails.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between py-3 text-sm">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>

                <Button className="w-full" variant="outline" disabled>
                  View Client Profile
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent showCloseButton={false}>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove saved job?</AlertDialogTitle>
            <AlertDialogDescription>
              This job will be removed from your Saved Jobs list. You can save it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel render={<Button variant="outline" />} disabled={isBookmarkLoading}>
              Cancel
            </AlertDialogCancel>
            <Button variant="destructive" disabled={isBookmarkLoading} onClick={removeBookmark}>
              {isBookmarkLoading ? "Removing..." : "Remove"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
