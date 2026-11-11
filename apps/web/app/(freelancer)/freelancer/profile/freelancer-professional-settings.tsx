"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  Languages,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
} from "@/components/icons";
import { Save } from "lucide-react";

import { profileApiRequest } from "@/apiRequests/profile";
import { profileRevisionApiRequest } from "@/apiRequests/profile-revision";
import { ProfileReviewStatus } from "@/components/profile-review-status";
import { CvAnalysisDialog } from "./cv-analysis-dialog";
import { ApiFail } from "@/lib/http";
import {
  AvailabilityStatus,
  type AvailabilityStatusType,
  type CvAnalysisDraftType,
  type FreelancerProfileDetailType,
  type FreelancerSkillType,
  type PortfolioItemType,
  type ProfileRevisionType,
  type UpdatePortfolioType,
} from "@shared/types";
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
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";

const MAX_CV_SIZE = 10 * 1024 * 1024;

type Props = {
  profileId: number;
  userId: number | null;
};

type ProfessionalForm = {
  title: string;
  bio: string;
  availabilityStatus: AvailabilityStatusType;
  experience: string;
  education: string;
  certifications: string;
  languages: string;
};

type PortfolioForm = {
  title: string;
  description: string;
  technologies: string;
  projectUrl: string;
};

type SkillOption = { id: number; name: string };

function splitValues(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinValues(values: string[] | null | undefined) {
  return values?.join("\n") ?? "";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiFail) {
    return (
      error.response.error.details?.[0]?.message ?? error.response.error.message
    );
  }
  return error instanceof Error ? error.message : fallback;
}

export function FreelancerProfessionalSettings({ profileId, userId }: Props) {
  const t = useTranslations("freelancerProfile");
  const tCommon = useTranslations("common");

  const [profile, setProfile] = useState<FreelancerProfileDetailType | null>(null);
  const [skills, setSkills] = useState<FreelancerSkillType[]>([]);
  const [portfolios, setPortfolios] = useState<PortfolioItemType[]>([]);
  const [profileRevision, setProfileRevision] = useState<ProfileRevisionType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Form states
  const [form, setForm] = useState<ProfessionalForm>({
    title: "",
    bio: "",
    availabilityStatus: AvailabilityStatus.AVAILABLE,
    experience: "",
    education: "",
    certifications: "",
    languages: "",
  });

  // Skill management
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState("5");
  const [skillOptions, setSkillOptions] = useState<SkillOption[]>([]);
  const [isSkillMenuOpen, setIsSkillMenuOpen] = useState(false);
  const skillPickerRef = useRef<HTMLDivElement>(null);
  const [skillToDelete, setSkillToDelete] = useState<FreelancerSkillType | null>(null);

  // Portfolio management
  const [portfolioEditor, setPortfolioEditor] = useState<PortfolioItemType | "new" | null>(null);
  const [portfolioForm, setPortfolioForm] = useState<PortfolioForm>({
    title: "",
    description: "",
    technologies: "",
    projectUrl: "",
  });
  const [portfolioToDelete, setPortfolioToDelete] = useState<PortfolioItemType | null>(null);

  // CV management
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [cvToDelete, setCvToDelete] = useState(false);
  const [cvAnalysisDraft, setCvAnalysisDraft] = useState<CvAnalysisDraftType | null>(null);
  const [cvAnalysisDialogOpen, setCvAnalysisDialogOpen] = useState(false);

  const getProficiencyLabel = (level: number) => {
    if (level >= 8) return t("proficiencyExpert");
    if (level >= 4) return t("proficiencyIntermediate");
    return t("proficiencyBeginner");
  };

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [pRes, sRes, portRes] = await Promise.all([
        profileApiRequest.getProfileDetail(profileId),
        profileApiRequest.getSkills(profileId),
        profileApiRequest.getPortfoliosList(profileId),
      ]);

      if (!pRes.success || !sRes.success || !portRes.success) {
        throw new Error(t("toast.loadFailed"));
      }

      setProfile(pRes.data);
      setSkills(sRes.data);
      setPortfolios(portRes.data);

      const fp = pRes.data.freelancerProfile;
      setForm({
        title: fp?.title ?? "",
        bio: pRes.data.bio ?? "",
        availabilityStatus: pRes.data.availabilityStatus,
        experience: joinValues(fp?.experience),
        education: joinValues(fp?.education),
        certifications: joinValues(fp?.certifications),
        languages: joinValues(fp?.languages),
      });

      try {
        const revRes = await profileRevisionApiRequest.getMine("FREELANCER");
        setProfileRevision(revRes.data.revision);
      } catch {
        setProfileRevision(null);
      }
    } catch (err) {
      setLoadError(getErrorMessage(err, t("toast.loadFailedRetry")));
    } finally {
      setIsLoading(false);
    }
  }, [profileId, t]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Skill autocomplete suggestions
  useEffect(() => {
    if (!skillDialogOpen || !isSkillMenuOpen) return;
    let ignore = false;
    const timeout = setTimeout(async () => {
      try {
        const res = await profileApiRequest.searchSkillSuggestions(skillName.trim());
        if (!ignore && res.success) {
          setSkillOptions(res.data);
        }
      } catch {
        if (!ignore) setSkillOptions([]);
      }
    }, skillName.trim() ? 250 : 0);

    return () => {
      ignore = true;
      clearTimeout(timeout);
    };
  }, [isSkillMenuOpen, skillDialogOpen, skillName]);

  // Close skill menu on click outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (!skillPickerRef.current?.contains(e.target as Node)) {
        setIsSkillMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const availableSkillOptions = useMemo(
    () =>
      skillOptions.filter(
        (opt) => !skills.some((s) => s.skill.name.toLowerCase() === opt.name.toLowerCase()),
      ),
    [skillOptions, skills],
  );

  // Save professional info
  const handleSaveInfo = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!form.title.trim()) {
      toastError({ message: t("toast.requiredFields") });
      return;
    }

    setPendingAction("save-info");
    try {
      const res = await profileApiRequest.updateProfile(profileId, {
        displayName: profile.displayName ?? "Freelancer",
        title: form.title.trim(),
        bio: form.bio.trim() || null,
        availabilityStatus: form.availabilityStatus,
        experience: splitValues(form.experience),
        education: splitValues(form.education),
        certifications: splitValues(form.certifications),
        languages: splitValues(form.languages),
      });

      if (!res.success) throw new Error(t("toast.profileUpdateFailed"));
      setProfileRevision(res.data.revision);

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              bio: form.bio.trim() || null,
              availabilityStatus: form.availabilityStatus,
              profileCompletionPercent: res.data.profileStrength,
              freelancerProfile: prev.freelancerProfile
                ? {
                    ...prev.freelancerProfile,
                    title: form.title.trim(),
                    experience: splitValues(form.experience),
                    education: splitValues(form.education),
                    certifications: splitValues(form.certifications),
                    languages: splitValues(form.languages),
                  }
                : prev.freelancerProfile,
            }
          : prev,
      );

      toastSuccess({ message: res.data.message || t("savedSuccess") });
    } catch (err) {
      toastError({ message: getErrorMessage(err, t("toast.profileUpdateFailedRetry")) });
    } finally {
      setPendingAction(null);
    }
  };

  // Skill Add & Delete
  const handleAddSkill = async (e: FormEvent) => {
    e.preventDefault();
    const name = skillName.trim();
    const level = Number(skillLevel);
    if (!name) {
      toastError({ message: t("toast.selectSkill") });
      return;
    }
    if (skills.some((s) => s.skill.name.toLowerCase() === name.toLowerCase())) {
      toastError({ message: t("toast.skillAlreadyAdded") });
      return;
    }

    setPendingAction("skill-add");
    try {
      const res = await profileApiRequest.addSkill(profileId, {
        skillName: name,
        proficiencyLevel: level,
      });
      if (!res.success) throw new Error(t("toast.addSkillFailed"));
      setSkills((prev) =>
        [...prev, res.data].sort((a, b) => a.skill.name.localeCompare(b.skill.name)),
      );
      setSkillName("");
      setSkillLevel("5");
      setSkillDialogOpen(false);
      toastSuccess({ message: t("toast.skillAdded") });
    } catch (err) {
      toastError({ message: getErrorMessage(err, t("toast.addSkillFailedRetry")) });
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteSkill = async () => {
    if (!skillToDelete) return;
    setPendingAction("skill-delete");
    try {
      await profileApiRequest.deleteSkill(skillToDelete.id);
      setSkills((prev) => prev.filter((s) => s.id !== skillToDelete.id));
      setSkillToDelete(null);
      toastSuccess({ message: t("toast.skillRemoved") });
    } catch (err) {
      toastError({ message: getErrorMessage(err, t("toast.removeSkillFailed")) });
    } finally {
      setPendingAction(null);
    }
  };

  // Portfolio Add/Edit/Delete
  const openPortfolioModal = (item: PortfolioItemType | "new") => {
    setPortfolioEditor(item);
    if (item === "new") {
      setPortfolioForm({
        title: "",
        description: "",
        technologies: "",
        projectUrl: "",
      });
    } else {
      setPortfolioForm({
        title: item.title,
        description: item.description ?? "",
        technologies: item.technologies.join(", "),
        projectUrl: item.projectUrl ?? "",
      });
    }
  };

  const handleSavePortfolio = async (e: FormEvent) => {
    e.preventDefault();
    if (!portfolioEditor || !portfolioForm.title.trim()) {
      toastError({ message: t("toast.portfolioTitleRequired") });
      return;
    }

    const payload: UpdatePortfolioType = {
      title: portfolioForm.title.trim(),
      description: portfolioForm.description.trim() || null,
      technologies: splitValues(portfolioForm.technologies),
      projectUrl: portfolioForm.projectUrl.trim() || null,
    };

    setPendingAction("portfolio-save");
    try {
      if (portfolioEditor === "new") {
        const res = await profileApiRequest.addPortfolio(profileId, payload);
        if (!res.success) throw new Error(t("toast.createPortfolioFailed"));
        setPortfolios((prev) => [res.data, ...prev]);
        toastSuccess({ message: t("toast.portfolioCreated") });
      } else {
        const res = await profileApiRequest.updatePortfolio(portfolioEditor.id, payload);
        if (!res.success) throw new Error(t("toast.updatePortfolioFailed"));
        setPortfolios((prev) =>
          prev.map((p) => (p.id === portfolioEditor.id ? res.data : p)),
        );
        toastSuccess({ message: t("toast.portfolioUpdated") });
      }
      setPortfolioEditor(null);
    } catch (err) {
      toastError({ message: getErrorMessage(err, t("toast.savePortfolioFailed")) });
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeletePortfolio = async () => {
    if (!portfolioToDelete) return;
    setPendingAction("portfolio-delete");
    try {
      await profileApiRequest.deletePortfolio(portfolioToDelete.id);
      setPortfolios((prev) => prev.filter((p) => p.id !== portfolioToDelete.id));
      setPortfolioToDelete(null);
      toastSuccess({ message: t("toast.portfolioDeleted") });
    } catch (err) {
      toastError({ message: getErrorMessage(err, t("toast.deletePortfolioFailed")) });
    } finally {
      setPendingAction(null);
    }
  };

  // CV Actions
  const handleAnalyzeCv = async () => {
    setPendingAction("cv-analyze");
    try {
      const res = await profileApiRequest.analyzeCv(profileId);
      if (res.data?.analysis) {
        setCvAnalysisDraft(res.data.analysis);
        setCvAnalysisDialogOpen(true);
      } else {
        toastError({
          message: "Không nhận được dữ liệu phân tích từ dịch vụ AI.",
        });
      }
    } catch (err) {
      toastError({
        message: getErrorMessage(
          err,
          "Không thể phân tích CV bằng AI. Vui lòng đảm bảo dịch vụ AI (port 8000 & Ollama) đang hoạt động.",
        ),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleUploadCv = async (file: File) => {
    if (file.type !== "application/pdf" || file.size > MAX_CV_SIZE) {
      toastError({ message: "Vui lòng chọn tệp PDF có dung lượng không quá 10 MB." });
      return;
    }
    setPendingAction("cv-upload");
    try {
      const res = await profileApiRequest.uploadCv(profileId, file);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              freelancerProfile: prev.freelancerProfile
                ? { ...prev.freelancerProfile, cvFileName: res.data.cvFileName }
                : null,
            }
          : prev,
      );
      if (cvInputRef.current) cvInputRef.current.value = "";
      toastSuccess({ message: t("cvUploadSuccess") });

      // Tự động kích hoạt phân tích CV bằng AI
      void handleAnalyzeCv();
    } catch (err) {
      toastError({ message: getErrorMessage(err, "Không thể tải lên CV.") });
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteCv = async () => {
    setPendingAction("cv-delete");
    try {
      await profileApiRequest.deleteCv(profileId);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              freelancerProfile: prev.freelancerProfile
                ? { ...prev.freelancerProfile, cvFileName: null }
                : null,
            }
          : prev,
      );
      setCvToDelete(false);
      setCvAnalysisDraft(null);
      setCvAnalysisDialogOpen(false);
      toastSuccess({ message: t("cvDeleteSuccess") });
    } catch (err) {
      toastError({ message: getErrorMessage(err, "Không thể xoá CV.") });
    } finally {
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-[#0069D3]" />
        <p className="mt-3 text-sm">{t("loadingProfile")}</p>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-sm font-medium text-destructive">{loadError}</p>
        <Button variant="outline" size="sm" onClick={() => void loadAll()} className="mt-4">
          <RefreshCw className="mr-2 size-4" /> {t("tryAgain")}
        </Button>
      </div>
    );
  }

  const completion = profile.profileCompletionPercent ?? 0;
  const freelancer = profile.freelancerProfile;

  return (
    <div className="space-y-8">
      {/* Top Banner Card: Profile Status & Strength */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-linear-to-r from-[#D0E1F8]/30 via-background to-background p-6 dark:from-[#0069D3]/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#0069D3] px-2.5 py-0.5 text-xs font-semibold text-white">
                Freelancer
              </span>
              <Badge variant="outline" className="border-border">
                {t(`availability.${profile.availabilityStatus}`)}
              </Badge>
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {freelancer?.title || t("noTitle")}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("professionalInfoHint")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="default"
              size="sm"
              asChild
              className="bg-[#0069D3] text-white hover:bg-[#0058b3]"
            >
              <Link href={`/profiles/${profileId}`} target="_blank">
                <Eye className="mr-1.5 size-4" />
                {t("viewPublicProfile")}
                <ExternalLink className="ml-1 size-3.5 opacity-70" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Profile Strength Bar */}
        <div className="mt-5 border-t border-border/60 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Sparkles className="size-3.5 text-[#0069D3]" />
              {t("profileStrength")}: {completion}%
            </span>
            <span className="text-muted-foreground">{t("profileStrengthHint")}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[#0069D3] transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        {profileRevision && (
          <div className="mt-4">
            <ProfileReviewStatus revision={profileRevision} profileStrength={completion} />
          </div>
        )}
      </div>

      {/* Grid: Main Info + CV / Skills / Portfolio */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left Column: Professional Details Form */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <BriefcaseBusiness className="size-5 text-[#0069D3]" />
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {t("professionalInfo")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Chức danh, giới thiệu và trạng thái hoạt động công khai.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveInfo} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pro-title">{t("fieldProfessionalTitle")}</Label>
                  <Input
                    id="pro-title"
                    placeholder="e.g. Senior Fullstack Developer, UI/UX Designer"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pro-availability">{t("fieldAvailability")}</Label>
                  <Select
                    value={form.availabilityStatus}
                    onValueChange={(val) =>
                      val && setForm((prev) => ({ ...prev, availabilityStatus: val as AvailabilityStatusType }))
                    }
                  >
                    <SelectTrigger id="pro-availability">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AvailabilityStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(`availability.${status}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pro-bio">{t("fieldBio")}</Label>
                <Textarea
                  id="pro-bio"
                  rows={4}
                  placeholder="Giới thiệu bản thân, chuyên môn thế mạnh và mục tiêu nghề nghiệp..."
                  value={form.bio}
                  onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                />
              </div>

              {/* Experience */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pro-experience">{t("fieldExperience")}</Label>
                  <span className="text-[11px] text-muted-foreground">{t("hintOnePerLine")}</span>
                </div>
                <Textarea
                  id="pro-experience"
                  rows={3}
                  placeholder="Senior Frontend Developer - ABC Corp (2022 - Nay)&#10;Fullstack Developer - Freelance (2020 - 2022)"
                  value={form.experience}
                  onChange={(e) => setForm((prev) => ({ ...prev, experience: e.target.value }))}
                />
              </div>

              {/* Education, Certifications, Languages */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pro-education">{t("education")}</Label>
                  </div>
                  <Textarea
                    id="pro-education"
                    rows={3}
                    placeholder="Đại học Bách Khoa&#10;Kỹ thuật phần mềm (2018 - 2022)"
                    value={form.education}
                    onChange={(e) => setForm((prev) => ({ ...prev, education: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pro-certs">{t("certifications")}</Label>
                  </div>
                  <Textarea
                    id="pro-certs"
                    rows={3}
                    placeholder="AWS Solutions Architect&#10;IELTS 7.5"
                    value={form.certifications}
                    onChange={(e) => setForm((prev) => ({ ...prev, certifications: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pro-lang">{t("languages")}</Label>
                  </div>
                  <Textarea
                    id="pro-lang"
                    rows={3}
                    placeholder="Tiếng Việt (Bản xứ)&#10;Tiếng Anh (Thành thạo)"
                    value={form.languages}
                    onChange={(e) => setForm((prev) => ({ ...prev, languages: e.target.value }))}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={pendingAction === "save-info"}
                  className="bg-[#0069D3] text-white hover:bg-[#0058b3]"
                >
                  {pendingAction === "save-info" ? (
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-1.5 size-4" />
                  )}
                  {t("saveProfessionalInfo")}
                </Button>
              </div>
            </form>
          </section>

          {/* Portfolio Management */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Award className="size-5 text-[#0069D3]" />
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {t("portfolioTitle")} ({portfolios.length})
                  </h3>
                  <p className="text-xs text-muted-foreground">{t("portfolioDescription")}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openPortfolioModal("new")}
                className="gap-1 border-[#0069D3]/30 text-[#0069D3] hover:bg-[#0069D3]/10"
              >
                <Plus className="size-3.5" />
                {t("addPortfolio")}
              </Button>
            </div>

            {portfolios.length === 0 ? (
              <div className="py-10 text-center">
                <BriefcaseBusiness className="mx-auto size-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm font-medium text-foreground">{t("noPortfolioTitle")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("noPortfolioOwner")}</p>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {portfolios.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-xl border border-border/80 bg-background p-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                          {item.title}
                        </h4>
                        {item.projectUrl && (
                          <a
                            href={item.projectUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#0069D3] hover:underline shrink-0"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </div>
                      {item.description && (
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      {item.technologies.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {item.technologies.slice(0, 4).map((tech) => (
                            <span
                              key={tech}
                              className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-medium"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-border/60 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => openPortfolioModal(item)}
                      >
                        <Pencil className="mr-1 size-3" />
                        {t("edit")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={() => setPortfolioToDelete(item)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Skills & CV */}
        <div className="space-y-6">
          {/* CV Section */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <FileText className="size-5 text-[#0069D3]" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t("cvSectionTitle")}</h3>
                <p className="text-[11px] text-muted-foreground">{t("uploadCvHint")}</p>
              </div>
            </div>

            <div className="mt-4">
              {freelancer?.cvFileName ? (
                <div className="rounded-xl border border-border/80 bg-background p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-[#0069D3]/10 p-2 text-[#0069D3]">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {freelancer.cvFileName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t("cvAvailableNotice")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 border-t border-border/60 pt-3">
                    <Button
                      type="button"
                      size="sm"
                      className="w-full bg-[#4fae2e] text-xs font-semibold text-white shadow-xs hover:bg-[#439c28]"
                      onClick={() => void handleAnalyzeCv()}
                      disabled={pendingAction === "cv-analyze" || pendingAction === "cv-upload"}
                    >
                      {pendingAction === "cv-analyze" ? (
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1.5 size-3.5" />
                      )}
                      {pendingAction === "cv-analyze"
                        ? t("analyzingCv")
                        : t("analyzeCv")}
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1 text-xs">
                        <a
                          href={`/api/backend/profiles/${profileId}/cv/file`}
                          target="_blank"
                          rel="noreferrer"
                          download
                        >
                          <Download className="mr-1 size-3.5" />
                          {t("downloadCv")}
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => setCvToDelete(true)}
                        disabled={pendingAction === "cv-delete" || pendingAction === "cv-analyze"}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-5 text-center">
                  <FileText className="mx-auto size-7 text-muted-foreground/40" />
                  <p className="mt-1.5 text-xs text-muted-foreground">{t("noCvUploaded")}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs"
                    onClick={() => cvInputRef.current?.click()}
                    disabled={pendingAction === "cv-upload"}
                  >
                    {pendingAction === "cv-upload" ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <Upload className="mr-1.5 size-3.5" />
                    )}
                    {t("uploadCv")}
                  </Button>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={cvInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUploadCv(file);
                }}
              />

              {freelancer?.cvFileName && (
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={() => cvInputRef.current?.click()}
                    className="text-[11px] text-[#0069D3] hover:underline cursor-pointer"
                  >
                    {t("replaceCv")}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Skills Section */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {t("skillsTitle")} ({skills.length})
                </h3>
                <p className="text-[11px] text-muted-foreground">{t("skillsDescription")}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSkillDialogOpen(true)}
                className="h-8 gap-1 text-xs border-[#0069D3]/30 text-[#0069D3] hover:bg-[#0069D3]/10"
              >
                <Plus className="size-3.5" />
                {t("addSkill")}
              </Button>
            </div>

            {skills.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                {t("noSkillsOwner")}
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border/60">
                {skills.map((s) => (
                  <li key={s.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-xs font-semibold text-foreground">
                            {s.skill.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {s.proficiencyLevel}/10 · {getProficiencyLabel(s.proficiencyLevel)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-[#0069D3]"
                            style={{ width: `${s.proficiencyLevel * 10}%` }}
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => setSkillToDelete(s)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Dialog: Add Skill */}
      <Dialog
        open={skillDialogOpen}
        onOpenChange={(open) => {
          setSkillDialogOpen(open);
          if (!open) {
            setSkillOptions([]);
            setIsSkillMenuOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addSkillTitle")}</DialogTitle>
            <DialogDescription>{t("addSkillDescription")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSkill} className="space-y-4">
            <div className="relative space-y-1.5" ref={skillPickerRef}>
              <Label htmlFor="skill-input">{t("fieldSkillName")}</Label>
              <Input
                id="skill-input"
                autoComplete="off"
                placeholder={t("skillSearchPlaceholder")}
                value={skillName}
                onChange={(e) => {
                  setSkillName(e.target.value);
                  setIsSkillMenuOpen(true);
                }}
                onFocus={() => setIsSkillMenuOpen(true)}
              />
              {isSkillMenuOpen && availableSkillOptions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-lg">
                  {availableSkillOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-foreground hover:bg-[#D0E1F8]/30 dark:hover:bg-zinc-800"
                      onClick={() => {
                        setSkillName(opt.name);
                        setIsSkillMenuOpen(false);
                      }}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="skill-prof">{t("fieldProficiency")}</Label>
              <Select value={skillLevel} onValueChange={(val) => val && setSkillLevel(val)}>
                <SelectTrigger id="skill-prof">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => (
                    <SelectItem key={lvl} value={String(lvl)}>
                      {lvl}/10 · {getProficiencyLabel(lvl)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSkillDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={pendingAction === "skill-add"}
                className="bg-[#0069D3] text-white hover:bg-[#0058b3]"
              >
                {pendingAction === "skill-add" ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Plus className="mr-1.5 size-4" />
                )}
                {t("saveSkill")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Delete Skill */}
      <AlertDialog
        open={skillToDelete !== null}
        onOpenChange={(open) => !open && setSkillToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteSkillTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteSkillDescription", { name: skillToDelete?.skill.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteSkill()}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t("confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Add/Edit Portfolio */}
      <Dialog
        open={portfolioEditor !== null}
        onOpenChange={(open) => !open && setPortfolioEditor(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {portfolioEditor === "new" ? t("addPortfolioTitle") : t("editPortfolioTitle")}
            </DialogTitle>
            <DialogDescription>{t("portfolioFormDescription")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePortfolio} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pf-title">{t("fieldProjectTitle")}</Label>
              <Input
                id="pf-title"
                value={portfolioForm.title}
                onChange={(e) => setPortfolioForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pf-desc">{t("fieldDescription")}</Label>
              <Textarea
                id="pf-desc"
                rows={3}
                value={portfolioForm.description}
                onChange={(e) => setPortfolioForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pf-tech">{t("fieldTechnologies")}</Label>
                <span className="text-[11px] text-muted-foreground">{t("hintTechnologies")}</span>
              </div>
              <Input
                id="pf-tech"
                placeholder={t("technologiesPlaceholder")}
                value={portfolioForm.technologies}
                onChange={(e) => setPortfolioForm((prev) => ({ ...prev, technologies: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pf-url">{t("fieldProjectUrl")}</Label>
              <Input
                id="pf-url"
                placeholder={t("projectUrlPlaceholder")}
                value={portfolioForm.projectUrl}
                onChange={(e) => setPortfolioForm((prev) => ({ ...prev, projectUrl: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPortfolioEditor(null)}>
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={pendingAction === "portfolio-save"}
                className="bg-[#0069D3] text-white hover:bg-[#0058b3]"
              >
                {pendingAction === "portfolio-save" && (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                )}
                {t("saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Delete Portfolio */}
      <AlertDialog
        open={portfolioToDelete !== null}
        onOpenChange={(open) => !open && setPortfolioToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deletePortfolioTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deletePortfolioDescription", { title: portfolioToDelete?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeletePortfolio()}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t("confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Delete CV */}
      <AlertDialog open={cvToDelete} onOpenChange={setCvToDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteCvConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteCvDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteCv()}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t("deleteCv")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: AI CV Analysis & Review */}
      {cvAnalysisDraft && (
        <CvAnalysisDialog
          profileId={profileId}
          draft={cvAnalysisDraft}
          open={cvAnalysisDialogOpen}
          onOpenChange={setCvAnalysisDialogOpen}
          onConfirmed={() => {
            void loadAll();
          }}
        />
      )}
    </div>
  );
}
