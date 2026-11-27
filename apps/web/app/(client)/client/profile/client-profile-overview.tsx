"use client";

import {
  ArrowUpRight,
  Building2,
  ExternalLink,
  Globe,
  Pencil,
} from "@/components/icons";
import { ProfileReviewStatus } from "@/components/profile-review-status";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import type {
  GeneralProfileType,
  ProfileRevisionType,
  SocialLinkType,
} from "@shared/types";
import { useTranslations } from "next-intl";

type Company = {
  companyName: string;
  companyDescription: string;
  website: string;
};

type Props = {
  account: GeneralProfileType;
  company: Company;
  socialLinks: SocialLinkType[];
  revision: ProfileRevisionType | null;
  companyError: string | null;
  canEditPersonal: boolean;
  canEditCompany: boolean;
  canViewSocial: boolean;
  onEditPersonal: () => void;
  onEditCompany: () => void;
  onEditSocial: () => void;
  onRetry: () => void;
};

export function ClientProfileOverview({
  account,
  company,
  socialLinks,
  revision,
  companyError,
  canEditPersonal,
  canEditCompany,
  canViewSocial,
  onEditPersonal,
  onEditCompany,
  onEditSocial,
  onRetry,
}: Props) {
  const t = useTranslations("clientProfileSettings.overview");
  const tProfile = useTranslations("freelancerProfile.overview");
  const tRole = useTranslations("roleName");
  const tPlatform = useTranslations("socialPlatform");
  const name = account.displayName || t("nameFallback");
  const completion = Math.min(
    100,
    Math.max(0, account.profileCompletionPercent),
  );
  const links = socialLinks.filter((link) => /^https?:\/\//i.test(link.url));
  const website = /^https?:\/\//i.test(company.website)
    ? company.website
    : null;
  const panel = "min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-7";

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside
        className={`${panel} space-y-6`}
        aria-label={tProfile("profileSummary")}
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
              aria-label={tProfile("editPersonal")}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
        <div>
          <h2 className="break-words text-2xl font-semibold tracking-tight">
            {name}
          </h2>
          {!!company.companyName && !companyError && (
            <p className="mt-2 break-words text-sm text-muted-foreground">
              {company.companyName}
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
        {links.length > 0 ? (
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
        ) : canViewSocial ? (
          <Button
            variant="link"
            className="h-auto p-0 text-sm text-[#0069D3] dark:text-blue-300"
            onClick={onEditSocial}
          >
            {tProfile("addSocialLinks")}{" "}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Button>
        ) : null}
        <div className="space-y-3 border-t border-border pt-6">
          <div className="flex justify-between gap-3 text-xs font-medium">
            <span className="text-muted-foreground">
              {tProfile("completion")}
            </span>
            <span className="tabular-nums">{completion}%</span>
          </div>
          <div
            role="progressbar"
            aria-label={tProfile("completion")}
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
          {canEditCompany && (
            <Button
              variant="outline"
              className="mt-1 w-full"
              onClick={onEditCompany}
            >
              {t("editCompany")}{" "}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </aside>

      <div className="min-w-0 space-y-6">
        {revision && (
          <ProfileReviewStatus
            revision={revision}
            profileStrength={account.profileCompletionPercent}
          />
        )}
        <section className={`${panel} space-y-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold">{tProfile("about")}</h3>
            {canEditPersonal && (
              <Button size="sm" variant="ghost" onClick={onEditPersonal}>
                <Pencil className="size-3.5" aria-hidden="true" />
                {tProfile("edit")}
              </Button>
            )}
          </div>
          <p className="whitespace-pre-line break-words text-sm leading-7 text-muted-foreground">
            {account.bio || t("aboutEmpty")}
          </p>
        </section>
        <section className={`${panel} space-y-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2.5 text-base font-semibold">
              <Building2
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              {t("companyTitle")}
            </h3>
            {canEditCompany && (
              <Button size="sm" variant="ghost" onClick={onEditCompany}>
                <Pencil className="size-3.5" aria-hidden="true" />
                {tProfile("edit")}
              </Button>
            )}
          </div>
          {companyError ? (
            <div role="alert" className="space-y-3">
              <p className="text-sm text-destructive">{companyError}</p>
              <Button variant="outline" onClick={onRetry}>
                {tProfile("retry")}
              </Button>
            </div>
          ) : (
            <>
              <div>
                <h4 className="break-words text-lg font-semibold">
                  {company.companyName || t("companyEmpty")}
                </h4>
                <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-muted-foreground">
                  {company.companyDescription || t("descriptionEmpty")}
                </p>
              </div>
              {website ? (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 border-t border-border pt-4 text-sm text-[#0069D3] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-blue-300"
                >
                  <Globe
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 break-all">
                    {website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
                  </span>
                  <ArrowUpRight
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                </a>
              ) : (
                <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                  {t("websiteEmpty")}
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
