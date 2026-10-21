import type { ProfileRevisionType } from "@shared/types";
import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";

export function ProfileReviewStatus({
  revision,
  profileStrength,
}: {
  revision: ProfileRevisionType | null;
  profileStrength?: number | null;
}) {
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
        title: "Admin review required for profile updates",
        body: `Your profile strength is ${profileStrength}%. Until it reaches 20%, profile changes must be approved by an administrator.`,
        className:
          "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
      }
    : revision.status === "PENDING"
      ? {
          icon: Clock3,
          title: "Profile changes awaiting review",
          body: isExpert
            ? "Your approved profile remains unchanged while an administrator reviews this expert profile update."
            : `Submitted at ${revision.profileStrength}% profile strength. Your approved public profile remains visible while an administrator reviews these changes.`,
          className:
            "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
        }
      : revision.status === "APPROVED"
        ? {
            icon: CheckCircle2,
            title: "Profile changes approved",
            body: isExpert
              ? "Your reviewed expert profile changes are now active. Future updates will also require administrator approval."
              : profileStrength !== null &&
                  profileStrength !== undefined &&
                  profileStrength < 20
                ? `Your changes are visible, but your profile strength is still ${profileStrength}%. Future changes will require administrator approval until it reaches 20%.`
                : "Your reviewed changes are now visible on your public profile.",
            className:
              "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100",
          }
        : {
            icon: AlertCircle,
            title: "Profile changes need attention",
            body: revision.reviewNotes
              ? `Reason: ${revision.reviewNotes}`
              : "The submitted changes were not approved. Update the information and submit it again.",
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
