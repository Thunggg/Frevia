"use client";

import { profileApiRequest } from "@/apiRequests/profile";
import { profileRevisionApiRequest } from "@/apiRequests/profile-revision";
import {
  ArrowUpRight,
  Award,
  BriefcaseBusiness,
  ExternalLink,
  FileText,
  GraduationCap,
  Languages,
  Pencil,
  RefreshCw,
} from "@/components/icons";
import { ProfileReviewStatus } from "@/components/profile-review-status";
import { useActionPermission } from "@/hooks/use-action-permission";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import type { GeneralProfileType, SocialLinkType } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export type FreelancerProfileOverviewProps = {
  account: GeneralProfileType;
  profileId: number;
  socialLinks: SocialLinkType[];
  onEditPersonal: () => void;
  onEditProfessional: () => void;
  onEditSocial: () => void;
};

const panelClassName =
  "min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-7";

function OverviewSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={panelClassName}>
      <h3 className="mb-5 flex items-center gap-2.5 text-base font-semibold text-foreground">
        <span className="text-muted-foreground" aria-hidden="true">
          {icon}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function FreelancerProfileOverview({
  account,
  profileId,
  socialLinks,
  onEditPersonal,
  onEditProfessional,
  onEditSocial,
}: FreelancerProfileOverviewProps) {
  const t = useTranslations("freelancerProfile.overview");
  const tRole = useTranslations("roleName");
  const tPlatform = useTranslations("socialPlatform");
  const tAvailability = useTranslations("freelancerProfile.availability");
  const { can, isLoading: permissionsLoading } = useActionPermission();
  const canViewRevision = can("GET", "/api/profile-revisions/me");
  const canDownloadCv = can("GET", "/api/profiles/:id/cv/file");
  const canEditPersonal =
    can("PUT", "/api/account-profile") ||
    can("POST", "/api/account-profile/avatar");
  const canEditProfessional = can("PUT", "/api/profiles/:id");
  const canEditSocial = can("GET", "/api/social-links");
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ["freelancer-profile-overview", profileId, canViewRevision],
    enabled: !permissionsLoading,
    staleTime: 0,
    queryFn: async () => {
      const [detail, skills, revision] = await Promise.all([
        profileApiRequest.getProfileDetail(profileId),
        profileApiRequest
          .getSkills(profileId)
          .then((response) => response.data)
          .catch(() => null),
        canViewRevision
          ? profileRevisionApiRequest
              .getMine("FREELANCER")
              .then((response) => ({
                revision: response.data.revision,
                failed: false,
              }))
              .catch(() => ({ revision: null, failed: true }))
          : Promise.resolve({ revision: null, failed: false }),
      ]);
      return { profile: detail.data, skills, ...revision };
    },
  });
  const professional = data?.profile.freelancerProfile;
  const completion = Math.min(
    100,
    Math.max(0, account.profileCompletionPercent),
  );
  const name = account.displayName || t("nameFallback");
  const links = socialLinks.filter((link) => /^https?:\/\//i.test(link.url));
  const availability = data?.profile.availabilityStatus;

  const list = (values: string[] | null | undefined, empty: string) =>
    values?.length ? (
      <ul className="divide-y divide-border">
        {values.map((value, index) => (
          <li
            key={`${index}-${value}`}
            className="whitespace-pre-line break-words py-4 text-sm leading-relaxed first:pt-0 last:pb-0"
          >
            {value}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm leading-relaxed text-muted-foreground">{empty}</p>
    );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside
        className={`${panelClassName} space-y-6`}
        aria-label={t("profileSummary")}
      >
        <div className="flex items-start justify-between gap-4">
          <Avatar className="size-24 border border-border">
            <AvatarImage src={account.avatarUrl ?? undefined} alt={name} />
            <AvatarFallback className="bg-primary/10 text-3xl font-semibold text-primary">
              {name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {canEditPersonal && (
            <Button
              size="icon"
              variant="outline"
              onClick={onEditPersonal}
              aria-label={t("editPersonal")}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
        <div>
          <h2 className="break-words text-2xl font-semibold tracking-tight text-foreground">
            {name}
          </h2>
          {isPending ? (
            <Skeleton className="mt-2 h-4 w-40" />
          ) : (
            <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">
              {professional?.title || t("headlineEmpty")}
            </p>
          )}
          <p className="mt-2 break-all text-xs text-muted-foreground">
            {account.email}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {account.roles.map((role) => (
              <Badge
                key={role.name}
                variant="secondary"
                className={
                  role.isPrimary
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200"
                    : undefined
                }
              >
                {tRole.has(role.name) ? tRole(role.name) : role.name}
              </Badge>
            ))}
          </div>
        </div>
        {links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                {tPlatform.has(link.platform)
                  ? tPlatform(link.platform)
                  : link.platform}
              </a>
            ))}
          </div>
        )}
        {canEditSocial && !links.length && (
          <Button
            variant="link"
            className="h-auto p-0 text-sm text-[#0069D3] dark:text-blue-300"
            onClick={onEditSocial}
          >
            {t("addSocialLinks")}{" "}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Button>
        )}
        {canDownloadCv && professional?.cvFileName && (
          <a
            href={`/api/backend/profiles/${profileId}/cv/file`}
            className="flex min-w-0 items-center gap-2 text-sm font-medium underline underline-offset-4 hover:text-[#0069D3] dark:hover:text-blue-300"
          >
            <FileText className="size-4 shrink-0" aria-hidden="true" />
            <span>{t("viewCv")}</span>
          </a>
        )}
        <div className="space-y-3 border-t border-border pt-6">
          <div className="flex justify-between gap-3 text-xs font-medium">
            <span className="text-muted-foreground">{t("completion")}</span>
            <span className="tabular-nums">{completion}%</span>
          </div>
          <div
            role="progressbar"
            aria-label={t("completion")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completion}
            className="h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-[#0069D3] dark:bg-blue-400"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("completionHint")}
          </p>
          {canEditProfessional && (
            <Button
              variant="outline"
              className="mt-1 w-full"
              onClick={onEditProfessional}
            >
              {t("editProfessional")}{" "}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </aside>

      <div className="min-w-0 space-y-6" aria-busy={isPending || isFetching}>
        {isPending ? (
          <div
            className={`${panelClassName} space-y-5`}
            role="status"
            aria-label={t("loading")}
          >
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : isError ? (
          <div className={panelClassName} role="alert">
            <p className="text-sm text-destructive">{t("loadFailed")}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={isFetching ? "size-4 animate-spin" : "size-4"}
              />{" "}
              {t("retry")}
            </Button>
          </div>
        ) : data ? (
          <>
            {data.revision && (
              <ProfileReviewStatus
                revision={data.revision}
                profileStrength={account.profileCompletionPercent}
              />
            )}
            {data.failed && (
              <p className="text-sm text-muted-foreground" role="status">
                {t("reviewUnavailable")}
              </p>
            )}
            <section className={`${panelClassName} space-y-5`}>
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold">{t("about")}</h3>
                {canEditProfessional && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onEditProfessional}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />{" "}
                    {t("edit")}
                  </Button>
                )}
              </div>
              <p className="whitespace-pre-line break-words text-sm leading-7 text-muted-foreground">
                {account.bio || t("aboutEmpty")}
              </p>
              {availability && (
                <div className="flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                  <BriefcaseBusiness className="size-4" aria-hidden="true" />
                  {tAvailability(availability)}
                </div>
              )}
            </section>
            <OverviewSection
              title={t("experience")}
              icon={<BriefcaseBusiness className="size-4" />}
            >
              {list(professional?.experience, t("experienceEmpty"))}
            </OverviewSection>
            <OverviewSection
              title={t("skills")}
              icon={<Award className="size-4" />}
            >
              {data.skills === null ? (
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {t("skillsFailed")}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isFetching}
                    onClick={() => void refetch()}
                  >
                    {t("retry")}
                  </Button>
                </div>
              ) : data.skills.length ? (
                <ul className="flex flex-wrap gap-2">
                  {data.skills.map((item) => (
                    <li key={item.id} className="min-w-0 max-w-full">
                      <Badge
                        variant="outline"
                        className="max-w-full whitespace-normal break-words rounded-full px-3 py-1.5 text-sm font-normal"
                      >
                        {item.skill.name}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("skillsEmpty")}
                </p>
              )}
            </OverviewSection>
            <OverviewSection
              title={t("education")}
              icon={<GraduationCap className="size-4" />}
            >
              {list(professional?.education, t("educationEmpty"))}
            </OverviewSection>
            {professional?.languages?.length ||
            professional?.certifications?.length ? (
              <div className="grid gap-6 xl:grid-cols-2">
                {!!professional.languages?.length && (
                  <OverviewSection
                    title={t("languages")}
                    icon={<Languages className="size-4" />}
                  >
                    {list(professional.languages, "")}
                  </OverviewSection>
                )}
                {!!professional.certifications?.length && (
                  <OverviewSection
                    title={t("certifications")}
                    icon={<Award className="size-4" />}
                  >
                    {list(professional.certifications, "")}
                  </OverviewSection>
                )}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
