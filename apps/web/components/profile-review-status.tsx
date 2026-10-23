import type { ProfileRevisionType } from "@shared/types";
import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import { useTranslations } from "next-intl";

export function ProfileReviewStatus({
  revision,
  profileStrength,
}: {
  revision: ProfileRevisionType | null;
  profileStrength?: number | null;
}) {
  const t = useTranslations("profileReviewStatus");
  const isExpert = revision?.profileType === "EXPERT";
  if (
    !revision &&
    (profileStrength === null ||
      profileStrength === undefined ||
      profileStrength >= 20)
  ) {
    return null;
  }

  const config = !revision
    ? {
        icon: Clock3,
        title: t("requiredTitle"),
        body: t("requiredBody", { profileStrength: profileStrength ?? 0 }),
        className:
          "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
      }
    : revision.status === "PENDING"
      ? {
          icon: Clock3,
          title: t("pendingTitle"),
          body: isExpert
            ? t("pendingExpertBody")
            : t("pendingBody", { profileStrength: revision.profileStrength }),
          className:
            "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
        }
      : revision.status === "APPROVED"
        ? {
            icon: CheckCircle2,
            title: t("approvedTitle"),
            body: isExpert
              ? t("approvedExpertBody")
              : profileStrength !== null &&
                  profileStrength !== undefined &&
                  profileStrength < 20
                ? t("approvedLowStrengthBody", { profileStrength: profileStrength ?? 0 })
                : t("approvedBody"),
            className:
              "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100",
          }
        : {
            icon: AlertCircle,
            title: t("rejectedTitle"),
            body: revision.reviewNotes
              ? t("rejectedWithReason", { reason: revision.reviewNotes })
              : t("rejectedBody"),
            className:
              "border-red-300 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100",
          };

  const Icon = config.icon;
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${config.className}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold">{config.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed opacity-80">
          {config.body}
        </p>
      </div>
    </div>
  );
}
