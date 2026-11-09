"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bell,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "@/components/icons";

import jobAlertApiRequest from "@/apiRequests/job-alert";
import { Badge } from "@repo/ui/components/shadcn/badge";
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
import { Label } from "@repo/ui/components/shadcn/label";
import { Switch } from "@repo/ui/components/shadcn/switch";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type {
  CreateJobAlertBodyType,
  JobAlertFrequencyType,
  JobAlertType,
  NotificationChannelType,
} from "@shared/types";

type JobAlertsContentProps = {
  initialJobAlerts: JobAlertType[];
};

export function JobAlertsContent({
  initialJobAlerts,
}: JobAlertsContentProps) {
  const t = useTranslations("jobAlerts");
  const format = useFormatter();

  const [alerts, setAlerts] = useState<JobAlertType[]>(initialJobAlerts);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State (Create & Edit)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<JobAlertType | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<JobAlertFrequencyType>("DAILY");
  const [channels, setChannels] = useState<NotificationChannelType[]>(["IN_APP"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Dialog State
  const [deletingAlert, setDeletingAlert] = useState<JobAlertType | null>(null);

  const isLimitReached = alerts.length >= 10;

  const formatDate = (value: string | Date) =>
    format.dateTime(new Date(value), {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // Filter alerts by query
  const filteredAlerts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return alerts;
    return alerts.filter((alert) => {
      const matchName = alert.name?.toLowerCase().includes(q);
      const matchKeywords = alert.keywords?.toLowerCase().includes(q);
      const matchSkills = alert.skills.some((s) => s.toLowerCase().includes(q));
      return Boolean(matchName || matchKeywords || matchSkills);
    });
  }, [alerts, searchQuery]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingAlert(null);
    setName("");
    setKeywords("");
    setSkillInput("");
    setSkills([]);
    setFrequency("DAILY");
    setChannels(["IN_APP"]);
    setIsDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (alert: JobAlertType) => {
    setEditingAlert(alert);
    setName(alert.name ?? "");
    setKeywords(alert.keywords ?? "");
    setSkillInput("");
    setSkills(alert.skills ?? []);
    setFrequency(alert.frequency);
    setChannels(alert.channels ?? ["IN_APP"]);
    setIsDialogOpen(true);
  };

  // Add skill tag
  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skills.length >= 20) return;
    if (!skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput("");
  };

  // Remove skill tag
  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Toggle active state
  const handleToggleActive = async (alert: JobAlertType) => {
    const newActive = !alert.isActive;
    const prevAlerts = [...alerts];

    // Optimistic Update
    setAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, isActive: newActive } : a)),
    );

    try {
      await jobAlertApiRequest.update(alert.id, { isActive: newActive });
      toastSuccess({
        message: newActive ? t("statusActive") : t("statusPaused"),
      });
    } catch {
      setAlerts(prevAlerts);
      toastError({ message: t("updateFailed") });
    }
  };

  // Save (Create or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim() && skills.length === 0) {
      toastError({ message: t("keywordsLabel") });
      return;
    }
    if (channels.length === 0) {
      toastError({ message: t("channelsLabel") });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAlert) {
        const updatePayload = {
          name: name.trim() || undefined,
          keywords: keywords.trim() || null,
          skills,
          frequency,
          channels,
        };
        const res = await jobAlertApiRequest.update(
          editingAlert.id,
          updatePayload,
        );
        const updated = res.data;
        setAlerts((prev) =>
          prev.map((a) => (a.id === editingAlert.id ? updated : a)),
        );
        toastSuccess({ message: t("updated") });
      } else {
        const createPayload: CreateJobAlertBodyType = {
          name: name.trim() || undefined,
          keywords: keywords.trim() || null,
          skills,
          frequency,
          channels,
        };
        const res = await jobAlertApiRequest.create(createPayload);
        const created = res.data;
        setAlerts((prev) => [created, ...prev]);
        toastSuccess({ message: t("created") });
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      toastError({ message: msg || (editingAlert ? t("updateFailed") : t("createFailed")) });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Alert
  const handleDeleteConfirm = async () => {
    if (!deletingAlert) return;
    const targetId = deletingAlert.id;
    const prevAlerts = [...alerts];

    setAlerts((prev) => prev.filter((a) => a.id !== targetId));
    setIsSubmitting(true);

    try {
      await jobAlertApiRequest.delete(targetId);
      toastSuccess({ message: t("deleted") });
      setDeletingAlert(null);
    } catch {
      setAlerts(prevAlerts);
      toastError({ message: t("deleteFailed") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAlertTitle = (alert: JobAlertType) => {
    if (alert.name?.trim()) return alert.name;
    if (alert.keywords?.trim()) return alert.keywords;
    if (alert.skills?.length) return alert.skills.join(" • ");
    return t("title");
  };

  const toFindWorkHref = (alert: JobAlertType) => {
    const params = new URLSearchParams();
    if (alert.keywords?.trim()) params.set("keyword", alert.keywords.trim());
    if (alert.skills?.length) params.set("skills", alert.skills.join(","));
    const query = params.toString();
    return query ? `/freelancer/find-work?${query}` : "/freelancer/find-work";
  };

  return (
    <div className="flex flex-1 flex-col bg-background font-sans min-h-0">
      {/* Header Banner */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                <Bell className="size-6 text-[#4fae2e]" />
                {t("title")}
              </h1>
              <p className="mt-1 text-xs font-normal text-muted-foreground max-w-xl">
                {t("subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-black/5 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-foreground">
                {t("limitIndicator", { count: alerts.length })}
              </span>
              <Button
                onClick={handleOpenCreate}
                disabled={isLimitReached}
                className="rounded-full bg-[#4fae2e] text-white hover:bg-[#459928] text-xs font-semibold h-10 px-4 gap-1.5"
              >
                <Plus className="size-4" />
                {t("createAlert")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        {/* Controls: Search */}
        {alerts.length > 0 && (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-10 rounded-full border-border bg-card"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* List Content */}
        {alerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
              <Bell className="size-7" />
            </div>
            <h2 className="text-lg font-medium text-foreground">
              {t("emptyTitle")}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              {t("emptyHint")}
            </p>
            <Button
              onClick={handleOpenCreate}
              className="mt-6 rounded-full bg-[#4fae2e] text-white hover:bg-[#459928] text-xs font-semibold"
            >
              <Plus className="size-4 mr-1.5" />
              {t("createAlert")}
            </Button>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Search className="size-6" />
            </div>
            <h3 className="text-base font-medium text-foreground">
              {t("noResults")}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              &ldquo;{searchQuery}&rdquo;
            </p>
            <Button
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => setSearchQuery("")}
            >
              <X className="size-3.5 mr-1.5" />
              Đặt lại
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAlerts.map((alert) => (
              <article
                key={alert.id}
                className="group flex min-h-60 flex-col rounded-xl border border-border bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#4fae2e]/40 hover:shadow-md"
              >
                {/* Header: Title & Switch */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`inline-block size-2 rounded-full ${
                          alert.isActive ? "bg-[#4fae2e]" : "bg-muted-foreground/40"
                        }`}
                      />
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {alert.isActive ? t("statusActive") : t("statusPaused")}
                      </span>
                      <span className="text-[11px] text-muted-foreground/60">•</span>
                      <span className="text-[11px] text-muted-foreground">
                        {t("createdAt", { date: formatDate(alert.createdAt) })}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold tracking-tight text-foreground line-clamp-1">
                      {getAlertTitle(alert)}
                    </h2>
                  </div>
                  <Switch
                    checked={alert.isActive}
                    onCheckedChange={() => handleToggleActive(alert)}
                    aria-label={alert.isActive ? t("togglePaused") : t("toggleActive")}
                  />
                </div>

                {/* Criteria: Keywords & Skills */}
                <div className="mt-3 space-y-2 flex-1">
                  {alert.keywords && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {t("keywordsLabel")}:{" "}
                      </span>
                      {alert.keywords}
                    </p>
                  )}
                  {alert.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {alert.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-[11px] font-normal"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Configuration Meta */}
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="capitalize">
                    {alert.frequency === "INSTANT"
                      ? t("frequencyInstant")
                      : alert.frequency === "WEEKLY"
                        ? t("frequencyWeekly")
                        : t("frequencyDaily")}
                  </span>
                  <div className="flex gap-1.5">
                    {alert.channels?.includes("IN_APP") && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        In-App
                      </Badge>
                    )}
                    {alert.channels?.includes("EMAIL") && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        Email
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-2 flex items-center justify-between gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 rounded-lg text-xs font-semibold h-8"
                  >
                    <Link href={toFindWorkHref(alert)}>
                      <Search className="size-3.5 mr-1.5" />
                      {t("viewMatchingJobs")}
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-foreground"
                    aria-label={t("editAlert")}
                    onClick={() => handleOpenEdit(alert)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                    aria-label={t("deleteAlert")}
                    onClick={() => setDeletingAlert(alert)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-[26px] border border-border bg-card p-6 shadow-2xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingAlert ? t("editAlert") : t("createAlert")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("subtitle")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Alert Name */}
            <div className="space-y-1.5">
              <Label htmlFor="alert-name" className="text-xs font-semibold">
                {t("nameLabel")}
              </Label>
              <Input
                id="alert-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                maxLength={100}
                className="rounded-full bg-background text-sm"
              />
            </div>

            {/* Keywords */}
            <div className="space-y-1.5">
              <Label htmlFor="alert-keywords" className="text-xs font-semibold">
                {t("keywordsLabel")}
              </Label>
              <Input
                id="alert-keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder={t("keywordsPlaceholder")}
                maxLength={200}
                className="rounded-full bg-background text-sm"
              />
            </div>

            {/* Skills Tags Input */}
            <div className="space-y-1.5">
              <Label htmlFor="skill-input" className="text-xs font-semibold">
                {t("skillsLabel")}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="skill-input"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder={t("skillsPlaceholder")}
                  maxLength={100}
                  className="rounded-full bg-background text-sm flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSkill}
                  className="rounded-full text-xs font-semibold px-4"
                >
                  <Plus className="size-3.5 mr-1" /> Thêm
                </Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Frequency Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("frequencyLabel")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "INSTANT" as const, label: t("frequencyInstant") },
                  { value: "DAILY" as const, label: t("frequencyDaily") },
                  { value: "WEEKLY" as const, label: t("frequencyWeekly") },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFrequency(opt.value)}
                    className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-all ${
                      frequency === opt.value
                        ? "border-[#4fae2e] bg-[#eaf8df] text-[#3f9225] font-semibold dark:bg-[#4fae2e]/15"
                        : "border-border bg-background text-muted-foreground hover:border-foreground/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Channels Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("channelsLabel")}</Label>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <Checkbox
                    checked={channels.includes("IN_APP")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setChannels([...channels, "IN_APP"]);
                      } else {
                        setChannels(channels.filter((c) => c !== "IN_APP"));
                      }
                    }}
                  />
                  {t("channelInApp")}
                </label>
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <Checkbox
                    checked={channels.includes("EMAIL")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setChannels([...channels, "EMAIL"]);
                      } else {
                        setChannels(channels.filter((c) => c !== "EMAIL"));
                      }
                    }}
                  />
                  {t("channelEmail")}
                </label>
              </div>
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="rounded-full"
                disabled={isSubmitting}
                onClick={() => setIsDialogOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                className="rounded-full bg-[#4fae2e] text-white hover:bg-[#459928] text-xs font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? t("saving") : t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deletingAlert && (
        <Dialog open onOpenChange={(open) => !open && setDeletingAlert(null)}>
          <DialogContent className="sm:max-w-sm rounded-[24px] border border-border bg-card p-6 shadow-xl font-sans">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">
                {t("deleteTitle")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("deleteHint", { name: getAlertTitle(deletingAlert) })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex gap-2">
              <Button
                variant="ghost"
                className="rounded-full text-xs"
                disabled={isSubmitting}
                onClick={() => setDeletingAlert(null)}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                className="rounded-full text-xs font-semibold"
                disabled={isSubmitting}
                onClick={handleDeleteConfirm}
              >
                {isSubmitting ? t("deleting") : t("confirmDelete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
