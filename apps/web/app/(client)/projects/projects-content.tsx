"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit2, Eye, Plus, Trash2 } from "lucide-react";

import jobApiRequest from "@/apiRequests/job";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { JobStatusType, JobType } from "@shared/types";

import { PostJobForm } from "./post-job-form";

type ProjectsContentProps = {
  initialJobs: JobType[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

function statusBadgeClass(status: string) {
  if (status === "OPEN") {
    return "border-transparent bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15";
  }
  return "";
}

export function ProjectsContent({
  initialJobs,
  pagination,
}: ProjectsContentProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [editingJob, setEditingJob] = useState<JobType | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDeleteJobId, setPendingDeleteJobId] = useState<number | null>(
    null,
  );

  const saveJob = (job: JobType) =>
    setJobs((current) =>
      current.some((item) => item.id === job.id)
        ? current.map((item) => (item.id === job.id ? job : item))
        : [job, ...current],
    );

  const deleteJob = async (jobId: number) => {
    try {
      await jobApiRequest.deleteJob(jobId);
      setJobs((current) => current.filter((job) => job.id !== jobId));
      toastSuccess({ message: "Job deleted" });
    } catch {
      toastError({ message: "Unable to delete job" });
    }
  };

  const changeStatus = async (jobId: number, status: JobStatusType) => {
    try {
      const response = await jobApiRequest.changeJobStatus(jobId, { status });
      if (!response.success) throw new Error();
      setJobs((current) =>
        current.map((job) => (job.id === jobId ? response.data : job)),
      );
      toastSuccess({ message: "Job status updated" });
    } catch {
      toastError({ message: "Unable to update status" });
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role="CLIENT" />

      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="transition-colors hover:text-[#4fae2e]">
                Home
              </Link>
              <span className="mx-2 text-foreground/35">/</span>
              <span className="font-medium text-foreground">My Jobs</span>
            </nav>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  My Jobs
                </h1>
                <p className="mt-2 max-w-[42ch] text-base text-foreground/70 dark:text-foreground/75">
                  Create and manage the jobs you post on Frevia.
                </p>
              </div>
              <Button
                asChild
                className="bg-[#4fae2e] text-white hover:bg-[#459928] dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a]"
              >
                <Link href="/projects/new">
                  <Plus className="mr-2 size-4" />
                  Post a job
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-foreground/65">
              <span className="font-semibold text-foreground">{jobs.length}</span>{" "}
              {jobs.length === 1 ? "job" : "jobs"} on this page
              {pagination.total > 0 ? (
                <>
                  <span className="mx-2 text-foreground/35">·</span>
                  <span className="font-semibold text-foreground">
                    {pagination.total}
                  </span>{" "}
                  total
                </>
              ) : null}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {jobs.length ? (
            <ul className="divide-y divide-border border-y border-border">
              {jobs.map((job) => (
                <li key={job.id}>
                  <div className="flex flex-col gap-4 px-3 py-6 transition-colors hover:bg-[#eaf8df]/35 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-7 dark:hover:bg-white/[0.04]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">
                          {job.title}
                        </h2>
                        <Badge
                          variant="outline"
                          className={statusBadgeClass(job.status)}
                        >
                          {job.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        ${job.budgetMin ?? 0} - ${job.budgetMax ?? 0}
                        <span className="mx-1.5 text-foreground/35">·</span>
                        {job.budgetType}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/projects/${job.id}`}>
                          <Eye className="mr-1 size-4" />
                          View
                        </Link>
                      </Button>
                      <select
                        value={job.status}
                        className="h-8 rounded-md border border-border bg-background px-2 text-sm"
                        onChange={(event) =>
                          changeStatus(
                            job.id,
                            event.target.value as JobStatusType,
                          )
                        }
                      >
                        {[
                          "DRAFT",
                          "OPEN",
                          "IN_PROGRESS",
                          "COMPLETED",
                          "CLOSED",
                          "CANCELLED",
                        ].map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingJob(job);
                          setIsFormOpen(true);
                        }}
                      >
                        <Edit2 className="mr-1 size-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setPendingDeleteJobId(job.id)}
                      >
                        <Trash2 className="mr-1 size-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
              <p className="text-lg font-medium text-foreground">
                No jobs posted yet
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Post your first job to start receiving proposals.
              </p>
              <Button
                asChild
                className="mt-6 bg-[#4fae2e] text-white hover:bg-[#459928]"
              >
                <Link href="/projects/new">
                  <Plus className="mr-2 size-4" />
                  Post a job
                </Link>
              </Button>
            </div>
          )}

          {pagination.totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() =>
                  router.push(`/projects?page=${pagination.page - 1}`)
                }
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  router.push(`/projects?page=${pagination.page + 1}`)
                }
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      </main>

      <PostJobForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSaved={saveJob}
        job={editingJob}
      />

      <AlertDialog
        open={pendingDeleteJobId !== null}
        onOpenChange={(open) => !open && setPendingDeleteJobId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDeleteJobId) deleteJob(pendingDeleteJobId);
                setPendingDeleteJobId(null);
              }}
            >
              Delete job
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
