"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { PostJobForm } from "@/app/(client)/client/jobs/_components/post-job-form";
import { useActionPermission } from "@/hooks/use-action-permission";
import { Button } from "@repo/ui/components/shadcn/button";

export function PostJobPageContent({
  isIdentityVerified = true,
}: {
  isIdentityVerified?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("postJob");
  const tSidebar = useTranslations("sidebar");
  const { can, isLoading: isPermissionLoading } = useActionPermission();

  const canCreate = can("POST", "/api/manage-jobs");

  if (!isPermissionLoading && !canCreate) {
    return (
      <div className="flex min-h-dvh flex-col bg-background font-sans">
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground shadow-xs">
              <p className="text-base font-semibold text-foreground mb-4">
                {t("accessDenied")}
              </p>
              <Button asChild variant="outline">
                <Link href="/client/jobs">
                  <ArrowLeft className="mr-2 size-4" />
                  {t("backToJobs")}
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isIdentityVerified) {
    return (
      <div className="flex min-h-dvh flex-col bg-background font-sans">
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-10 text-center shadow-xs">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-blue-50 text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-400">
                <ShieldCheck className="size-6" />
              </div>
              <h1 className="text-lg font-bold text-foreground mb-2">
                {t("kycRequiredTitle")}
              </h1>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {t("kycRequiredDesc")}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/client/jobs">
                    <ArrowLeft className="mr-2 size-4" />
                    {t("backToJobs")}
                  </Link>
                </Button>
                <Button
                  asChild
                  className="rounded-xl bg-[#0069D3] text-white hover:bg-[#005bb8]"
                >
                  <Link href="/client/profile?tab=identity">
                    {t("verifyNow")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
            <nav className="flex items-center gap-2 text-xs text-muted-foreground font-medium font-sans">
              <Link
                href="/client/jobs"
                className="transition-colors hover:text-[#0069D3]"
              >
                {tSidebar("navMyJobs")}
              </Link>
              <span className="text-muted-foreground/40">/</span>
              <span className="font-semibold text-foreground">
                {t("breadcrumb")}
              </span>
            </nav>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-xs">
            <PostJobForm
              mode="page"
              onSaved={() => {
                router.push("/client/jobs");
                router.refresh();
              }}
              onCancel={() => router.push("/client/jobs")}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
