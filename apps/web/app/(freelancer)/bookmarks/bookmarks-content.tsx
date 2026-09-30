"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bookmark, BriefcaseBusiness, Clock, DollarSign, MapPin, X } from "lucide-react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import jobApiRequest from "@/apiRequests/job";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Card, CardContent } from "@repo/ui/components/shadcn/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { ViewBookmarkedJobResponseType } from "@shared/types";

type BookmarksContentProps = {
  initialJobs: ViewBookmarkedJobResponseType["data"];
  pagination: ViewBookmarkedJobResponseType["pagination"];
};

function formatBudget(job: ViewBookmarkedJobResponseType["data"][number]) {
  if (job.budgetMin === null || job.budgetMax === null) return "Negotiable";
  return `$${job.budgetMin} - $${job.budgetMax}`;
}

function formatPostedTime(value: string | Date) {
  const hours = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 3_600_000));
  return hours < 24 ? `Posted ${hours || "just"} ${hours ? "hours" : "now"} ago` : `Posted ${Math.floor(hours / 24)} days ago`;
}

function getAvailability(job: ViewBookmarkedJobResponseType["data"][number]) {
  if (!job.expiryDate) return { label: "AVAILABLE", isExpiring: false };
  const hoursUntilExpiry = (new Date(job.expiryDate).getTime() - Date.now()) / 3_600_000;
  return hoursUntilExpiry <= 24
    ? { label: "EXPIRING SOON", isExpiring: true }
    : { label: "AVAILABLE", isExpiring: false };
}

export function BookmarksContent({ initialJobs, pagination }: BookmarksContentProps) {
  const router = useRouter();
  const [pendingRemoveJobId, setPendingRemoveJobId] = useState<number | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const removeBookmark = async (jobId: number) => {
    setIsRemoving(true);
    try {
      await jobApiRequest.removeBookmark(jobId);
      toastSuccess({ message: "Bookmark removed" });
      setPendingRemoveJobId(null);
      router.refresh();
    } catch {
      toastError({ message: "Unable to remove bookmark. Please try again." });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header role="FREELANCER" />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <nav className="text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-foreground">Bookmarks</span>
          </nav>

          <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold">
                <Bookmark className="size-7 text-primary" /> Saved Jobs
              </h1>
              <p className="mt-2 text-muted-foreground">Jobs you&apos;ve bookmarked for later</p>
              <p className="mt-1 text-sm text-muted-foreground">Total: {pagination.total} saved jobs</p>
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all"><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem></SelectContent></Select>
              <Select defaultValue="newest"><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Sort by: Newest</SelectItem></SelectContent></Select>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {initialJobs.length ? initialJobs.map((job) => {
              const availability = getAvailability(job);
              return (
                <Card key={job.id} className="border-border transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Badge variant={availability.isExpiring ? "destructive" : "secondary"} className={availability.isExpiring ? "" : "bg-primary/10 text-primary"}>{availability.label}</Badge>
                          <span className="text-muted-foreground">{formatPostedTime(job.createdAt)}</span>
                        </div>
                        <Link href={`/job/${job.id}`} className="mt-2 block w-fit text-xl font-bold hover:text-primary">
                          {job.title}
                        </Link>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="size-4" /> Remote (Worldwide)</span>
                          <span className="flex items-center gap-1 font-medium text-primary"><DollarSign className="size-4" /> {formatBudget(job)}</span>
                          <span className="flex items-center gap-1"><Clock className="size-4" /> {job.budgetType.replaceAll("_", " ")}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {job.skills.map((skill) => <Badge key={skill.id} variant="secondary" className="text-xs">{skill.skillName}</Badge>)}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:items-end">
                        <Button asChild><Link href={`/job/${job.id}`}><BriefcaseBusiness className="mr-2 size-4" />Apply Now</Link></Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setPendingRemoveJobId(job.id)}><X className="mr-1 size-4" />Remove</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">You have not saved any jobs yet.</div>}
          </div>

          {pagination.page < pagination.totalPages && (
            <div className="mt-8 text-center"><Button variant="outline" onClick={() => router.push(`/bookmarks?page=${pagination.page + 1}`)}>Load More Saved Jobs</Button></div>
          )}
        </div>
      </main>
      <AlertDialog
        open={pendingRemoveJobId !== null}
        onOpenChange={(open) => !open && setPendingRemoveJobId(null)}
      >
        <AlertDialogContent showCloseButton={false}>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove saved job?</AlertDialogTitle>
            <AlertDialogDescription>
              This job will be removed from your Saved Jobs list. You can save it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel render={<Button variant="outline" />} disabled={isRemoving}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isRemoving}
              onClick={() => pendingRemoveJobId && removeBookmark(pendingRemoveJobId)}
            >
              {isRemoving ? "Removing..." : "Remove"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Footer />
    </div>
  );
}
