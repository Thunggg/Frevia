"use client";

import { profileApiRequest } from "@/apiRequests/profile";
import { ApiFail } from "@/lib/http";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Input } from "@repo/ui/components/shadcn/input";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  type CvAnalysisConfirmType,
  type CvAnalysisDraftType,
} from "@shared/types";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Check,
  Loader2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type SkillRow = {
  selected: boolean;
  name: string;
  proficiencyLevel: number;
  confidence: number | null;
  evidence: string | null;
};

type ExperienceRow = {
  selected: boolean;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  confidence: number | null;
};

type EducationRow = {
  selected: boolean;
  degree: string;
  school: string;
  startYear: string;
  endYear: string;
  description: string;
  confidence: number | null;
};

type ProjectRow = {
  selected: boolean;
  name: string;
  technologies: string;
  description: string;
  confidence: number | null;
};

type Props = {
  profileId: number;
  draft: CvAnalysisDraftType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: (percent: number) => void;
};

function messageFrom(error: unknown, fallback: string) {
  if (error instanceof ApiFail) {
    return error.response.error.details?.[0]?.message ?? error.message;
  }
  return fallback;
}

export function CvAnalysisDialog({
  profileId,
  draft,
  open,
  onOpenChange,
  onConfirmed,
}: Props) {
  const t = useTranslations("cvAnalysis");
  const tCommon = useTranslations("common");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<"confirm" | "discard" | null>(
    null,
  );

  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [experience, setExperience] = useState<ExperienceRow[]>([]);
  const [education, setEducation] = useState<EducationRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);

  useEffect(() => {
    if (!open) return;

    setSkills(
      draft.payload.skills.map((s) => ({
        selected: s.confidence !== null && s.confidence >= 0.5,
        name: s.name,
        proficiencyLevel: s.proficiencyLevel ?? 5,
        confidence: s.confidence,
        evidence: s.evidence,
      })),
    );
    setExperience(
      draft.payload.experience.map((e) => ({
        selected: e.confidence !== null && e.confidence >= 0.5,
        title: e.title ?? "",
        company: e.company ?? "",
        startDate: e.startDate ?? "",
        endDate: e.endDate ?? "",
        isCurrent: e.isCurrent,
        description: e.description ?? "",
        confidence: e.confidence,
      })),
    );
    setEducation(
      draft.payload.education.map((ed) => ({
        selected: ed.confidence !== null && ed.confidence >= 0.5,
        degree: ed.degree ?? "",
        school: ed.school ?? "",
        startYear: ed.startYear?.toString() ?? "",
        endYear: ed.endYear?.toString() ?? "",
        description: ed.description ?? "",
        confidence: ed.confidence,
      })),
    );
    setProjects(
      draft.payload.projects.map((p) => ({
        selected: p.confidence !== null && p.confidence >= 0.5,
        name: p.name ?? "",
        technologies: p.technologies.join(", "),
        description: p.description ?? "",
        confidence: p.confidence,
      })),
    );
  }, [open, draft]);

  const hasWarnings = draft.meta.warnings.length > 0 || draft.meta.ocrUsed;
  const hasOcrNote =
    draft.meta.ocrUsed ||
    draft.meta.source === "PDF_OCR" ||
    draft.meta.warnings.some((w) =>
      w.toLowerCase().includes("ocr"),
    );

  const handleConfirm = async () => {
    setSubmitting(true);
    setPendingAction("confirm");
    try {
      const payload: CvAnalysisConfirmType = {
        skills: skills
          .filter((s) => s.selected && s.name.trim())
          .map((s) => ({
            skillName: s.name.trim(),
            proficiencyLevel: Math.max(
              1,
              Math.min(10, s.proficiencyLevel),
            ),
          })),
        experience: experience
          .filter(
            (e) =>
              e.selected &&
              (e.title.trim() ||
                e.company.trim() ||
                e.startDate.trim() ||
                e.endDate.trim() ||
                e.description.trim()),
          )
          .map((e) => ({
            title: e.title.trim() || null,
            company: e.company.trim() || null,
            startDate: e.startDate.trim() || null,
            endDate: e.endDate.trim() || null,
            isCurrent: e.isCurrent,
            description: e.description.trim() || null,
          })),
        education: education
          .filter(
            (ed) =>
              ed.selected &&
              (ed.degree.trim() ||
                ed.school.trim() ||
                ed.startYear.trim() ||
                ed.endYear.trim() ||
                ed.description.trim()),
          )
          .map((ed) => {
            const startYear = ed.startYear.trim()
              ? Number(ed.startYear.trim())
              : null;
            const endYear = ed.endYear.trim()
              ? Number(ed.endYear.trim())
              : null;
            return {
              degree: ed.degree.trim() || null,
              school: ed.school.trim() || null,
              startYear: isNaN(startYear as number) ? null : startYear,
              endYear: isNaN(endYear as number) ? null : endYear,
              description: ed.description.trim() || null,
            };
          }),
        projects: projects
          .filter((p) => p.selected && p.name.trim())
          .map((p) => ({
            name: p.name.trim(),
            technologies: p.technologies
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            description: p.description.trim() || null,
          })),
      };

      const res = await profileApiRequest.confirmCvAnalysis(
        profileId,
        draft.id,
        payload,
      );
      toastSuccess({ message: t("confirmedToast") });
      onOpenChange(false);
      onConfirmed(res.data.profileCompletionPercent);
    } catch (error) {
      toastError({
        message: messageFrom(error, t("confirmFailed")),
      });
    } finally {
      setSubmitting(false);
      setPendingAction(null);
      setConfirmOpen(false);
    }
  };

  const handleDiscard = async () => {
    setSubmitting(true);
    setPendingAction("discard");
    try {
      await profileApiRequest.discardCvAnalysis(profileId, draft.id);
      toastSuccess({ message: t("discardedToast") });
      onOpenChange(false);
    } catch (error) {
      toastError({
        message: messageFrom(error, t("discardFailed")),
      });
    } finally {
      setSubmitting(false);
      setPendingAction(null);
      setDiscardOpen(false);
    }
  };

  const selectedCount =
    skills.filter((s) => s.selected).length +
    experience.filter((e) => e.selected).length +
    education.filter((ed) => ed.selected).length +
    projects.filter((p) => p.selected).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-[#4fae2e]" />
              {t("dialogTitle")}
            </DialogTitle>
            <DialogDescription>{t("dialogDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {draft.isStale && (
              <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{t("staleNotice")}</span>
              </div>
            )}
            {hasWarnings && (
              <div className="flex gap-2 rounded-lg border border-blue-300 bg-blue-50 p-3 text-xs text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div className="space-y-1">
                  {hasOcrNote && <p>{t("ocrNote")}</p>}
                  {draft.meta.truncated && <p>{t("warningTruncated")}</p>}
                  {draft.meta.warnings.map((w, i) => {
                    const key = w.startsWith("EMPTY_SECTION:")
                      ? "warningEmptySection"
                      : w.includes("OCR")
                        ? "warningOcrLowQuality"
                        : w.includes("FIELD")
                          ? "warningUnknownFieldDropped"
                          : w.includes("DATE")
                            ? "warningDateUnparsed"
                            : "warningGeneric";
                    return <p key={i}>{t(key)}</p>;
                  })}
                </div>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {t("metaSummary", {
                pages: draft.meta.pages,
                chars: draft.meta.chars,
              })}
            </div>

            {draft.payload.summary && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">{t("summaryTitle")}</h3>
                <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed">
                  {draft.payload.summary}
                </p>
              </section>
            )}

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t("skillsTitle")}</h3>
                <span className="text-xs text-muted-foreground">
                  {skills.length}
                </span>
              </div>
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("emptySection")}
                </p>
              ) : (
                <div className="space-y-2">
                  {skills.map((s, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 ${s.selected ? "border-[#4fae2e]/40 bg-[#4fae2e]/5" : "border-border bg-card/30"}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={s.selected}
                          onCheckedChange={(v) =>
                            setSkills((prev) =>
                              prev.map((x, i) =>
                                i === idx
                                  ? { ...x, selected: Boolean(v) }
                                  : x,
                              ),
                            )
                          }
                          className="mt-2"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Input
                              value={s.name}
                              onChange={(e) =>
                                setSkills((prev) =>
                                  prev.map((x, i) =>
                                    i === idx ? { ...x, name: e.target.value } : x,
                                  ),
                                )
                              }
                              placeholder={t("skillName")}
                            />
                            <select
                              value={s.proficiencyLevel}
                              onChange={(e) =>
                                setSkills((prev) =>
                                  prev.map((x, i) =>
                                    i === idx
                                      ? { ...x, proficiencyLevel: parseInt(e.target.value) }
                                      : x,
                                  ),
                                )
                              }
                              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                          {s.confidence !== null && s.confidence < 0.5 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                              {t("lowConfidence")}
                            </span>
                          )}
                          {s.evidence && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">{t("evidence")}:</span>{" "}
                              {s.evidence}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {t("experienceTitleSection")}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {experience.length}
                </span>
              </div>
              {experience.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("emptySection")}
                </p>
              ) : (
                <div className="space-y-2">
                  {experience.map((e, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 ${e.selected ? "border-[#4fae2e]/40 bg-[#4fae2e]/5" : "border-border bg-card/30"}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={e.selected}
                          onCheckedChange={(v) =>
                            setExperience((prev) =>
                              prev.map((x, i) =>
                                i === idx
                                  ? { ...x, selected: Boolean(v) }
                                  : x,
                              ),
                            )
                          }
                          className="mt-2"
                        />
                        <div className="flex-1 space-y-2">
                          <Input
                            value={e.title}
                            onChange={(ev) =>
                              setExperience((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, title: ev.target.value }
                                    : x,
                                ),
                              )
                            }
                            placeholder={t("title")}
                          />
                          <Input
                            value={e.company}
                            onChange={(ev) =>
                              setExperience((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, company: ev.target.value }
                                    : x,
                                ),
                              )
                            }
                            placeholder={t("company")}
                          />
                          <div className="grid gap-2 sm:grid-cols-3">
                            <Input
                              value={e.startDate}
                              onChange={(ev) =>
                                setExperience((prev) =>
                                  prev.map((x, i) =>
                                    i === idx
                                      ? { ...x, startDate: ev.target.value }
                                      : x,
                                  ),
                                )
                              }
                              placeholder={t("startDate")}
                            />
                            <Input
                              value={e.endDate}
                              onChange={(ev) =>
                                setExperience((prev) =>
                                  prev.map((x, i) =>
                                    i === idx
                                      ? { ...x, endDate: ev.target.value }
                                      : x,
                                  ),
                                )
                              }
                              placeholder={t("endDate")}
                              disabled={e.isCurrent}
                            />
                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={e.isCurrent}
                                onCheckedChange={(v) =>
                                  setExperience((prev) =>
                                    prev.map((x, i) =>
                                      i === idx
                                        ? {
                                            ...x,
                                            isCurrent: Boolean(v),
                                            endDate: v
                                              ? ""
                                              : x.endDate,
                                          }
                                        : x,
                                    ),
                                  )
                                }
                              />
                              {t("current")}
                            </label>
                          </div>
                          <Textarea
                            value={e.description}
                            onChange={(ev) =>
                              setExperience((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, description: ev.target.value }
                                    : x,
                                ),
                              )
                            }
                            placeholder={t("description")}
                            rows={2}
                          />
                          {e.confidence !== null && e.confidence < 0.5 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                              {t("lowConfidence")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {t("educationTitleSection")}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {education.length}
                </span>
              </div>
              {education.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("emptySection")}
                </p>
              ) : (
                <div className="space-y-2">
                  {education.map((ed, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 ${ed.selected ? "border-[#4fae2e]/40 bg-[#4fae2e]/5" : "border-border bg-card/30"}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={ed.selected}
                          onCheckedChange={(v) =>
                            setEducation((prev) =>
                              prev.map((x, i) =>
                                i === idx
                                  ? { ...x, selected: Boolean(v) }
                                  : x,
                              ),
                            )
                          }
                          className="mt-2"
                        />
                        <div className="flex-1 space-y-2">
                          <Input
                            value={ed.degree}
                            onChange={(ev) =>
                              setEducation((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, degree: ev.target.value }
                                    : x,
                                ),
                              )
                            }
                            placeholder={t("degree")}
                          />
                          <Input
                            value={ed.school}
                            onChange={(ev) =>
                              setEducation((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, school: ev.target.value }
                                    : x,
                                ),
                              )
                            }
                            placeholder={t("school")}
                          />
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Input
                              value={ed.startYear}
                              onChange={(ev) =>
                                setEducation((prev) =>
                                  prev.map((x, i) =>
                                    i === idx
                                      ? { ...x, startYear: ev.target.value }
                                      : x,
                                  ),
                                )
                              }
                              placeholder={t("startYear")}
                            />
                            <Input
                              value={ed.endYear}
                              onChange={(ev) =>
                                setEducation((prev) =>
                                  prev.map((x, i) =>
                                    i === idx
                                      ? { ...x, endYear: ev.target.value }
                                      : x,
                                  ),
                                )
                              }
                              placeholder={t("endYear")}
                            />
                          </div>
                          <Textarea
                            value={ed.description}
                            onChange={(ev) =>
                              setEducation((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, description: ev.target.value }
                                    : x,
                                ),
                              )
                            }
                            placeholder={t("description")}
                            rows={2}
                          />
                          {ed.confidence !== null && ed.confidence < 0.5 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                              {t("lowConfidence")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {t("projectsTitleSection")}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {projects.length}
                </span>
              </div>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("emptySection")}
                </p>
              ) : (
                <div className="space-y-2">
                  {projects.map((p, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 ${p.selected ? "border-[#4fae2e]/40 bg-[#4fae2e]/5" : "border-border bg-card/30"}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={p.selected}
                          onCheckedChange={(v) =>
                            setProjects((prev) =>
                              prev.map((x, i) =>
                                i === idx
                                  ? { ...x, selected: Boolean(v) }
                                  : x,
                              ),
                            )
                          }
                          className="mt-2"
                        />
                        <div className="flex-1 space-y-2">
                          <Input
                            value={p.name}
                            onChange={(ev) =>
                              setProjects((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, name: ev.target.value }
                                    : x,
                                ),
                              )
                            }
                            placeholder={t("projectName")}
                          />
                          <Input
                            value={p.technologies}
                            onChange={(ev) =>
                              setProjects((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, technologies: ev.target.value }
                                    : x,
                                ),
                              )
                            }
                            placeholder={t("technologies")}
                          />
                          <p className="text-xs text-muted-foreground">
                            {t("technologiesHint")}
                          </p>
                          <Textarea
                            value={p.description}
                            onChange={(ev) =>
                              setProjects((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, description: ev.target.value }
                                    : x,
                                ),
                              )
                            }
                            placeholder={t("description")}
                            rows={2}
                          />
                          {p.confidence !== null && p.confidence < 0.5 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                              {t("lowConfidence")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {selectedCount === 0 && (
              <p className="text-sm text-destructive">{t("nothingSelected")}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDiscardOpen(true)}
              disabled={submitting}
            >
              {pendingAction === "discard" && submitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {t("discardAction")}
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                <X className="size-4" />
                {t("cancel")}
              </Button>
              <Button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={submitting || selectedCount === 0}
              >
                {pendingAction === "confirm" && submitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                {t("confirmAction")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmAction")}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCount} items will be added to your profile. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={submitting}>
              {pendingAction === "confirm" && submitting && (
                <Loader2 className="animate-spin" />
              )}
              {t("confirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("discardTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("discardDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDiscard}
              disabled={submitting}
            >
              {pendingAction === "discard" && submitting && (
                <Loader2 className="animate-spin" />
              )}
              {t("discardAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
