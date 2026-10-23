"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Heart,
  Languages,
  Link2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  UserCheck,
  UserMinus,
  UserPlus,
} from "@/components/icons";

import { accountProfileApi } from "@/apiRequests/account-profile";
import { profileApiRequest } from "@/apiRequests/profile";
import { profileRevisionApiRequest } from "@/apiRequests/profile-revision";
import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { VerifiedBadge } from "@/components/verified-badge";
import { ProfileReviewStatus } from "@/components/profile-review-status";
import { ApiFail } from "@/lib/http";
import { getProfileUpdateText } from "@/lib/profile-update-status";
import {
  AvailabilityStatus,
  type AvailabilityStatusType,
  type FreelancerProfileDetailType,
  type FreelancerSkillType,
  type PortfolioItemType,
  type UpdatePortfolioType,
  type ProfileRevisionType,
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/shadcn/tabs";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";

type ProfilePageClientProps = {
  profileId: number;
  currentUserId: number | null;
  headerRole: UserRole;
};

type ProfileForm = {
  displayName: string;
  title: string;
  bio: string;
  availabilityStatus: AvailabilityStatusType;
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

const EMPTY_PROFILE_FORM: ProfileForm = {
  displayName: "",
  title: "",
  bio: "",
  availabilityStatus: AvailabilityStatus.OFFLINE,
  education: "",
  certifications: "",
  languages: "",
};

const EMPTY_PORTFOLIO_FORM: PortfolioForm = {
  title: "",
  description: "",
  technologies: "",
  projectUrl: "",
};

const SOCIAL_PLATFORM_KEYS = [
  "GITHUB",
  "LINKEDIN",
  "TWITTER",
  "FACEBOOK",
  "INSTAGRAM",
  "YOUTUBE",
  "WEBSITE",
  "OTHER",
] as const;

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiFail) {
    return (
      error.response.error.details?.[0]?.message ?? error.response.error.message
    );
  }
  return error instanceof Error ? error.message : fallback;
}

function splitValues(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinValues(values: string[] | null | undefined) {
  return values?.join("\n") ?? "";
}

function getInitials(displayName: string | null, fallback: string) {
  return (displayName ?? fallback)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function SectionEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
        <UserRound className="size-7" />
      </div>
      <p className="text-lg font-medium text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function ProfilePageClient({
  profileId,
  currentUserId,
  headerRole,
}: ProfilePageClientProps) {
  const t = useTranslations("freelancerProfile");
  const tCommon = useTranslations("common");
  const tSocial = useTranslations("socialPlatform");
  const [profile, setProfile] = useState<FreelancerProfileDetailType | null>(
    null,
  );
  const [skills, setSkills] = useState<FreelancerSkillType[]>([]);
  const [portfolios, setPortfolios] = useState<PortfolioItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [profileForm, setProfileForm] =
    useState<ProfileForm>(EMPTY_PROFILE_FORM);
  const [skillEditorOpen, setSkillEditorOpen] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState("5");
  const [skillOptions, setSkillOptions] = useState<SkillOption[]>([]);
  const [isSkillMenuOpen, setIsSkillMenuOpen] = useState(false);
  const [skillSuggestionStatus, setSkillSuggestionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const skillPickerRef = useRef<HTMLDivElement>(null);
  const [skillToDelete, setSkillToDelete] =
    useState<FreelancerSkillType | null>(null);
  const [portfolioEditor, setPortfolioEditor] = useState<
    PortfolioItemType | "new" | null
  >(null);
  const [portfolioForm, setPortfolioForm] =
    useState<PortfolioForm>(EMPTY_PORTFOLIO_FORM);
  const [portfolioToDelete, setPortfolioToDelete] =
    useState<PortfolioItemType | null>(null);
  const [portfolioDetail, setPortfolioDetail] =
    useState<PortfolioItemType | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [unfollowDialogOpen, setUnfollowDialogOpen] = useState(false);
  const [profileRevision, setProfileRevision] =
    useState<ProfileRevisionType | null>(null);

  const isOwner = Boolean(profile && currentUserId === profile.userId);

  const getProficiencyLabel = (level: number) => {
    if (level >= 8) return t("proficiencyExpert");
    if (level >= 4) return t("proficiencyIntermediate");
    return t("proficiencyBeginner");
  };

  const loadProfile = useCallback(async () => {
    if (!Number.isInteger(profileId) || profileId <= 0) {
      setLoadError(t("toast.profileNotFound"));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const [
        profileResponse,
        skillsResponse,
        portfoliosResponse,
        favoritesResponse,
        followingResponse,
      ] = await Promise.all([
        profileApiRequest.getProfileDetail(profileId),
        profileApiRequest.getSkills(profileId),
        profileApiRequest.getPortfoliosList(profileId),
        headerRole === "CLIENT"
          ? accountProfileApi.getFavorites()
          : Promise.resolve(null),
        headerRole === "CLIENT"
          ? accountProfileApi.getFollowing()
          : Promise.resolve(null),
      ]);

      if (
        !profileResponse.success ||
        !skillsResponse.success ||
        !portfoliosResponse.success
      ) {
        throw new Error(t("toast.loadFailed"));
      }

      setProfile(profileResponse.data);
      if (currentUserId === profileResponse.data.userId) {
        try {
          const revisionResponse =
            await profileRevisionApiRequest.getMine("FREELANCER");
          setProfileRevision(revisionResponse.data.revision);
        } catch {
          setProfileRevision(null);
        }
      }
      setSkills(skillsResponse.data);
      setPortfolios(portfoliosResponse.data);
      setIsFavorite(
        favoritesResponse?.data.some(
          (favorite) => favorite.freelancerId === profileResponse.data.userId,
        ) ?? false,
      );
      setIsFollowing(
        followingResponse?.data.some(
          (follow) => follow.freelancerId === profileResponse.data.userId,
        ) ?? false,
      );
    } catch (error) {
      setLoadError(getErrorMessage(error, t("toast.loadFailedRetry")));
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, headerRole, profileId, t]);

  const toggleFavorite = async () => {
    if (!profile) return;
    setPendingAction("favorite");
    try {
      if (isFavorite) {
        await accountProfileApi.removeFavorite(profile.userId);
      } else {
        await accountProfileApi.addFavorite(profile.userId);
      }
      setIsFavorite((current) => !current);
      toastSuccess({
        message: isFavorite
          ? t("toast.favoriteRemoved")
          : t("toast.favoriteAdded"),
      });
    } catch (error) {
      toastError({
        message: getErrorMessage(error, t("toast.favoriteFailed")),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const toggleFollowing = async () => {
    if (!profile) return;
    setPendingAction("follow");
    try {
      if (isFollowing) {
        await accountProfileApi.unfollowFreelancer(profile.userId);
      } else {
        await accountProfileApi.followFreelancer(profile.userId);
      }
      setIsFollowing((current) => !current);
      if (isFollowing) setUnfollowDialogOpen(false);
      toastSuccess({
        message: isFollowing
          ? t("toast.unfollowed")
          : t("toast.followed"),
      });
    } catch (error) {
      toastError({
        message: getErrorMessage(error, t("toast.followFailed")),
      });
    } finally {
      setPendingAction(null);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!skillEditorOpen || !isSkillMenuOpen) return;

    let ignore = false;
    const timeoutId = window.setTimeout(
      async () => {
        setSkillSuggestionStatus("loading");
        try {
          const response = await profileApiRequest.searchSkillSuggestions(
            skillName.trim(),
          );
          if (!ignore && response.success) {
            setSkillOptions(response.data);
            setSkillSuggestionStatus("success");
          }
        } catch {
          if (!ignore) {
            setSkillOptions([]);
            setSkillSuggestionStatus("error");
          }
        }
      },
      skillName.trim() ? 250 : 0,
    );

    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [isSkillMenuOpen, skillEditorOpen, skillName]);

  useEffect(() => {
    const closeSkillMenu = (event: MouseEvent) => {
      if (!skillPickerRef.current?.contains(event.target as Node)) {
        setIsSkillMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeSkillMenu);
    return () => document.removeEventListener("mousedown", closeSkillMenu);
  }, []);

  const completion = profile?.profileCompletionPercent ?? 0;
  const availableSkillOptions = useMemo(
    () =>
      skillOptions.filter(
        (option) =>
          !skills.some(
            (skill) =>
              skill.skill.name.toLowerCase() === option.name.toLowerCase(),
          ),
      ),
    [skillOptions, skills],
  );

  const openProfileEditor = () => {
    if (!profile) return;
    setProfileForm({
      displayName: profile.displayName ?? "",
      title: profile.freelancerProfile?.title ?? "",
      bio: profile.bio ?? "",
      availabilityStatus: profile.availabilityStatus,
      education: joinValues(profile.freelancerProfile?.education),
      certifications: joinValues(profile.freelancerProfile?.certifications),
      languages: joinValues(profile.freelancerProfile?.languages),
    });
    setProfileEditorOpen(true);
  };

  const updateProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!profileForm.displayName.trim() || !profileForm.title.trim()) {
      toastError({
        message: t("toast.requiredFields"),
      });
      return;
    }

    setPendingAction("profile");
    try {
      const response = await profileApiRequest.updateProfile(profileId, {
        displayName: profileForm.displayName,
        title: profileForm.title,
        bio: profileForm.bio || null,
        availabilityStatus: profileForm.availabilityStatus,
        education: splitValues(profileForm.education),
        certifications: splitValues(profileForm.certifications),
        languages: splitValues(profileForm.languages),
      });
      if (!response.success) throw new Error(t("toast.profileUpdateFailed"));
      setProfileRevision(response.data.revision);
      if (!response.data.reviewRequired) {
        setProfile((current) =>
          current
            ? {
                ...current,
                displayName: profileForm.displayName,
                bio: profileForm.bio || null,
                availabilityStatus: profileForm.availabilityStatus,
                profileCompletionPercent: response.data.profileStrength,
                freelancerProfile: current.freelancerProfile
                  ? {
                      ...current.freelancerProfile,
                      title: profileForm.title,
                      education: splitValues(profileForm.education),
                      certifications: splitValues(profileForm.certifications),
                      languages: splitValues(profileForm.languages),
                    }
                  : current.freelancerProfile,
              }
            : current,
        );
      }
      setProfileEditorOpen(false);
      toastSuccess({ message: getProfileUpdateText(response.data.status) });
    } catch (error) {
      toastError({
        message: getErrorMessage(
          error,
          t("toast.profileUpdateFailedRetry"),
        ),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const addSkill = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedName = skillName.trim();
    const proficiencyLevel = Number(skillLevel);
    if (!normalizedName || !Number.isInteger(proficiencyLevel)) {
      toastError({ message: t("toast.selectSkill") });
      return;
    }
    if (
      skills.some(
        (skill) =>
          skill.skill.name.toLowerCase() === normalizedName.toLowerCase(),
      )
    ) {
      toastError({
        message: t("toast.skillAlreadyAdded"),
      });
      return;
    }

    setPendingAction("skill-add");
    try {
      const catalogResponse =
        await profileApiRequest.searchSkillSuggestions(normalizedName);
      const inCatalog =
        catalogResponse.success &&
        catalogResponse.data.some(
          (option) =>
            option.name.toLowerCase() === normalizedName.toLowerCase(),
        );
      if (!inCatalog) {
        toastError({
          message: t("toast.selectFromCatalog"),
        });
        return;
      }
      const response = await profileApiRequest.addSkill(profileId, {
        skillName: normalizedName,
        proficiencyLevel,
      });
      if (!response.success) throw new Error(t("toast.addSkillFailed"));
      setSkills((current) =>
        [...current, response.data].sort((first, second) =>
          first.skill.name.localeCompare(second.skill.name),
        ),
      );
      setSkillName("");
      setSkillLevel("5");
      setSkillOptions([]);
      setIsSkillMenuOpen(false);
      setSkillEditorOpen(false);
      toastSuccess({ message: t("toast.skillAdded") });
    } catch (error) {
      toastError({
        message: getErrorMessage(
          error,
          t("toast.addSkillFailedRetry"),
        ),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const deleteSkill = async () => {
    if (!skillToDelete) return;
    setPendingAction("skill-delete");
    try {
      await profileApiRequest.deleteSkill(skillToDelete.id);
      setSkills((current) =>
        current.filter((skill) => skill.id !== skillToDelete.id),
      );
      setSkillToDelete(null);
      toastSuccess({ message: t("toast.skillRemoved") });
    } catch (error) {
      toastError({
        message: getErrorMessage(
          error,
          t("toast.removeSkillFailed"),
        ),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const openPortfolioEditor = (portfolio: PortfolioItemType | "new") => {
    setPortfolioEditor(portfolio);
    setPortfolioForm(
      portfolio === "new"
        ? EMPTY_PORTFOLIO_FORM
        : {
            title: portfolio.title,
            description: portfolio.description ?? "",
            technologies: portfolio.technologies.join(", "),
            projectUrl: portfolio.projectUrl ?? "",
          },
    );
  };

  const savePortfolio = async (event: FormEvent) => {
    event.preventDefault();
    if (!portfolioEditor || !portfolioForm.title.trim()) {
      toastError({ message: t("toast.portfolioTitleRequired") });
      return;
    }

    const body: UpdatePortfolioType = {
      title: portfolioForm.title,
      description: portfolioForm.description || null,
      technologies: splitValues(portfolioForm.technologies),
      projectUrl: portfolioForm.projectUrl || null,
    };

    setPendingAction("portfolio-save");
    try {
      if (portfolioEditor === "new") {
        const response = await profileApiRequest.addPortfolio(profileId, body);
        if (!response.success)
          throw new Error(t("toast.createPortfolioFailed"));
        setPortfolios((current) => [response.data, ...current]);
        toastSuccess({ message: t("toast.portfolioCreated") });
      } else {
        const response = await profileApiRequest.updatePortfolio(
          portfolioEditor.id,
          body,
        );
        if (!response.success)
          throw new Error(t("toast.updatePortfolioFailed"));
        setPortfolios((current) =>
          current.map((portfolio) =>
            portfolio.id === portfolioEditor.id ? response.data : portfolio,
          ),
        );
        setPortfolioDetail((current) =>
          current?.id === response.data.id ? response.data : current,
        );
        toastSuccess({ message: t("toast.portfolioUpdated") });
      }
      setPortfolioEditor(null);
    } catch (error) {
      toastError({
        message: getErrorMessage(
          error,
          t("toast.savePortfolioFailed"),
        ),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const showPortfolioDetail = async (portfolio: PortfolioItemType) => {
    setPortfolioDetail(portfolio);
    setIsDetailLoading(true);
    try {
      const response = await profileApiRequest.getPortfolioDetail(portfolio.id);
      if (response.success) setPortfolioDetail(response.data);
    } catch (error) {
      toastError({
        message: getErrorMessage(error, t("toast.loadPortfolioFailed")),
      });
      setPortfolioDetail(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const deletePortfolio = async () => {
    if (!portfolioToDelete) return;
    setPendingAction("portfolio-delete");
    try {
      await profileApiRequest.deletePortfolio(portfolioToDelete.id);
      setPortfolios((current) =>
        current.filter((portfolio) => portfolio.id !== portfolioToDelete.id),
      );
      setPortfolioDetail((current) =>
        current?.id === portfolioToDelete.id ? null : current,
      );
      setPortfolioToDelete(null);
      toastSuccess({ message: t("toast.portfolioDeleted") });
    } catch (error) {
      toastError({
        message: getErrorMessage(
          error,
          t("toast.deletePortfolioFailed"),
        ),
      });
    } finally {
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Header role={headerRole} />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" /> {t("loadingProfile")}
          </div>
        </main>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Header role={headerRole} />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 text-center">
          <UserRound className="size-12 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">
            {t("unavailableTitle")}
          </h1>
          <p className="mt-2 text-muted-foreground">{loadError}</p>
          <Button className="mt-6" onClick={() => void loadProfile()}>
            <RefreshCw /> {t("tryAgain")}
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const freelancer = profile.freelancerProfile;
  const platformLabel = (platform: string) =>
    (SOCIAL_PLATFORM_KEYS as readonly string[]).includes(platform)
      ? tSocial(platform)
      : platform;

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={headerRole} />
      <main className="flex-1">        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="transition-colors hover:text-[#4fae2e]">
                {tCommon("home")}
              </Link>
              <span className="mx-2 text-foreground/35">/</span>
              <span className="font-medium text-foreground">
                {t("breadcrumbProfile")}
              </span>
            </nav>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {profile.displayName ?? t("unnamed")}
            </h1>
            <p className="mt-2 text-base text-foreground/70 dark:text-foreground/75">
              {freelancer?.title ?? t("noTitle")}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {isOwner ? (
            <div className="mb-5">
              <ProfileReviewStatus
                revision={profileRevision}
                profileStrength={completion}
              />
            </div>
          ) : null}
          <div className="overflow-hidden rounded-xl border border-border">
            <div
              className="h-44 bg-[#1a1c1a] bg-cover bg-center dark:bg-[#141514]"
              style={
                profile.coverUrl
                  ? { backgroundImage: `url(${profile.coverUrl})` }
                  : undefined
              }
            />
            <div className="relative px-6 pb-7 sm:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <Avatar className="-mt-14 size-28 border-4 border-background shadow-sm">
                    {profile.avatarUrl ? (
                      <AvatarImage
                        src={profile.avatarUrl}
                        alt={profile.displayName ?? t("unnamed")}
                      />
                    ) : null}
                    <AvatarFallback className="bg-[#eaf8df] text-2xl font-bold text-[#4fae2e] dark:bg-[#4fae2e]/15">
                      {getInitials(profile.displayName, t("unnamed"))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        {profile.displayName ?? t("unnamed")}
                      </h2>
                      {freelancer?.idVerified ? (
                        <VerifiedBadge size="sm" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-lg text-muted-foreground">
                      {freelancer?.title ?? t("noTitle")}
                    </p>
                    {profile.onlineStatus ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary">{t("onlineNow")}</Badge>
                      </div>
                    ) : null}
                  </div>
                </div>
                {isOwner ? (
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Button variant="outline" asChild>
                      <Link href="/account-profile">
                        <UserRound /> {t("profileSettings")}
                      </Link>
                    </Button>
                    <Button
                      className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                      onClick={openProfileEditor}
                    >
                      <Pencil /> {t("editProfile")}
                    </Button>
                  </div>
                ) : headerRole === "CLIENT" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      className={
                        isFollowing
                          ? "border-[#4fae2e]/35 text-[#438f2b] hover:bg-[#eaf8df] dark:text-[#78c85d] dark:hover:bg-[#4fae2e]/10"
                          : "bg-[#4fae2e] text-white hover:bg-[#459928]"
                      }
                      onClick={() => {
                        if (isFollowing) {
                          setUnfollowDialogOpen(true);
                        } else {
                          void toggleFollowing();
                        }
                      }}
                      disabled={pendingAction === "follow"}
                    >
                      {pendingAction === "follow" ? (
                        <Loader2 className="animate-spin" />
                      ) : isFollowing ? (
                        <UserCheck />
                      ) : (
                        <UserPlus />
                      )}
                      {isFollowing ? t("following") : t("follow")}
                    </Button>
                    <AlertDialog
                      open={unfollowDialogOpen}
                      onOpenChange={setUnfollowDialogOpen}
                    >
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("unfollowTitle", {
                              name:
                                profile.displayName ?? t("noNameFallback"),
                            })}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("unfollowDescription")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            disabled={pendingAction === "follow"}
                          >
                            {t("keepFollowing")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            disabled={pendingAction === "follow"}
                            onClick={(event) => {
                              event.preventDefault();
                              void toggleFollowing();
                            }}
                          >
                            {pendingAction === "follow" ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <UserMinus />
                            )}
                            {t("unfollow")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button
                      variant={isFavorite ? "default" : "outline"}
                      className={
                        isFavorite
                          ? "bg-[#4fae2e] text-white hover:bg-[#459928]"
                          : ""
                      }
                      onClick={() => void toggleFavorite()}
                      disabled={pendingAction === "favorite"}
                    >
                      {pendingAction === "favorite" ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Heart className={isFavorite ? "fill-current" : ""} />
                      )}
                      {isFavorite ? t("favorited") : t("addToFavorites")}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <Tabs defaultValue="about" className="min-w-0">
              <TabsList
                variant="line"
                className="w-full justify-start overflow-x-auto border-b"
              >
                <TabsTrigger value="about">{t("tabAbout")}</TabsTrigger>
                <TabsTrigger value="skills">
                  {t("tabSkills", { count: skills.length })}
                </TabsTrigger>
                <TabsTrigger value="portfolio">
                  {t("tabPortfolio", { count: portfolios.length })}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-5 space-y-8">
                <section>
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    {t("aboutMe")}
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {profile.bio || t("noBio")}
                  </p>
                </section>
                <div className="grid gap-8 md:grid-cols-2">
                  <DetailListCard
                    icon={GraduationCap}
                    title={t("education")}
                    items={freelancer?.education}
                    empty={t("noEducation")}
                  />
                  <DetailListCard
                    icon={Award}
                    title={t("certifications")}
                    items={freelancer?.certifications}
                    empty={t("noCertifications")}
                  />
                </div>
                <DetailListCard
                  icon={Languages}
                  title={t("languages")}
                  items={freelancer?.languages}
                  empty={t("noLanguages")}
                />
              </TabsContent>

              <TabsContent value="skills" className="mt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {t("skillsTitle")}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("skillsDescription")}
                    </p>
                  </div>
                  {isOwner ? (
                    <Button
                      size="sm"
                      className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                      onClick={() => setSkillEditorOpen(true)}
                    >
                      <Plus /> {t("addSkill")}
                    </Button>
                  ) : null}
                </div>
                {skills.length === 0 ? (
                  <div className="mt-5">
                    <SectionEmpty
                      title={t("noSkillsTitle")}
                      description={
                        isOwner ? t("noSkillsOwner") : t("noSkillsOther")
                      }
                    />
                  </div>
                ) : (
                  <ul className="mt-5 divide-y divide-border border-y border-border">
                    {skills.map((skill) => (
                      <li
                        key={skill.id}
                        className="flex items-center gap-4 px-1 py-4 sm:px-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-foreground">
                                {skill.skill.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getProficiencyLabel(skill.proficiencyLevel)} ·{" "}
                                {skill.proficiencyLevel}/10
                              </p>
                            </div>
                            {isOwner ? (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t("deleteSkillAria", {
                                  name: skill.skill.name,
                                })}
                                onClick={() => setSkillToDelete(skill)}
                              >
                                <Trash2 className="text-destructive" />
                              </Button>
                            ) : null}
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-[#4fae2e]"
                              style={{
                                width: `${skill.proficiencyLevel * 10}%`,
                              }}
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="portfolio" className="mt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {t("portfolioTitle")}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("portfolioDescription")}
                    </p>
                  </div>
                  {isOwner ? (
                    <Button
                      size="sm"
                      className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                      onClick={() => openPortfolioEditor("new")}
                    >
                      <Plus /> {t("addPortfolio")}
                    </Button>
                  ) : null}
                </div>
                {portfolios.length === 0 ? (
                  <div className="mt-5">
                    <SectionEmpty
                      title={t("noPortfolioTitle")}
                      description={
                        isOwner
                          ? t("noPortfolioOwner")
                          : t("noPortfolioOther")
                      }
                    />
                  </div>
                ) : (
                  <ul className="mt-5 divide-y divide-border border-y border-border">
                    {portfolios.map((portfolio) => (
                      <li key={portfolio.id} className="py-5">
                        <button
                          type="button"
                          className="group flex w-full flex-col gap-4 text-left sm:flex-row"
                          onClick={() => void showPortfolioDetail(portfolio)}
                        >
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold tracking-tight text-foreground transition-colors group-hover:text-[#4fae2e]">
                              {portfolio.title}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {portfolio.description || t("noDescription")}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {portfolio.technologies
                                .slice(0, 4)
                                .map((technology) => (
                                  <Badge
                                    key={technology}
                                    variant="secondary"
                                    className="border border-[#4fae2e]/20 bg-[#eaf8df] dark:border-[#4fae2e]/30 dark:bg-[#4fae2e]/10"
                                  >
                                    {technology}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        </button>
                        {isOwner ? (
                          <div className="mt-3 flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPortfolioEditor(portfolio)}
                            >
                              <Pencil /> {t("edit")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => setPortfolioToDelete(portfolio)}
                            >
                              <Trash2 /> {t("delete")}
                            </Button>
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>

            <aside className="space-y-6">
              <div className="rounded-xl border border-border p-5 sm:p-6">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  {t("profileStrength")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("percentComplete", { percent: completion })}
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[#4fae2e]"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("profileStrengthHint")}
                </p>
              </div>
              <div className="rounded-xl border border-border p-5 sm:p-6">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  {t("atAGlance")}
                </h3>
                <ul className="mt-4 divide-y divide-border text-sm">
                  <li className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Award className="size-4 text-[#4fae2e]" />{" "}
                      {t("skillsCount")}
                    </span>
                    <span className="font-medium">{skills.length}</span>
                  </li>
                  <li className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <BriefcaseBusiness className="size-4 text-[#4fae2e]" />{" "}
                      {t("projectsCount")}
                    </span>
                    <span className="font-medium">{portfolios.length}</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-xl border border-border p-5 sm:p-6">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  {t("socialLinks")}
                </h3>
                <ul className="mt-4 divide-y divide-border">
                  {profile.socialLinks.length > 0 ? (
                    profile.socialLinks.map((social) => (
                      <li key={social.id}>
                        <a
                          className="flex items-center gap-2 py-2.5 text-sm font-medium text-[#438f2b] transition-colors hover:text-[#367824] dark:text-[#78d65b] dark:hover:text-[#90e676]"
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Link2 className="size-4 shrink-0" />
                          <span className="min-w-0 flex-1 truncate">
                            {platformLabel(social.platform)}
                          </span>
                          <ExternalLink className="size-3.5 shrink-0" />
                        </a>
                      </li>
                    ))
                  ) : (
                    <li className="py-2 text-sm text-muted-foreground">
                      {t("noSocialLinks")}
                    </li>
                  )}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />

      <Dialog open={profileEditorOpen} onOpenChange={setProfileEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("editProfileTitle")}</DialogTitle>
            <DialogDescription>
              {t("editProfileDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={updateProfile} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t("fieldDisplayName")} htmlFor="display-name">
                <Input
                  id="display-name"
                  value={profileForm.displayName}
                  maxLength={255}
                  required
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                />
              </FormField>
              <FormField
                label={t("fieldProfessionalTitle")}
                htmlFor="professional-title"
              >
                <Input
                  id="professional-title"
                  value={profileForm.title}
                  maxLength={255}
                  required
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </FormField>
            </div>
            <FormField label={t("fieldBio")} htmlFor="profile-bio">
              <Textarea
                id="profile-bio"
                rows={5}
                maxLength={5000}
                value={profileForm.bio}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    bio: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField label={t("fieldAvailability")} htmlFor="availability">
              <Select
                value={profileForm.availabilityStatus}
                onValueChange={(value) =>
                  value &&
                  setProfileForm((current) => ({
                    ...current,
                    availabilityStatus: value as AvailabilityStatusType,
                  }))
                }
              >
                <SelectTrigger id="availability">
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
            </FormField>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                label={t("education")}
                htmlFor="education"
                hint={t("hintOnePerLine")}
              >
                <Textarea
                  id="education"
                  value={profileForm.education}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      education: event.target.value,
                    }))
                  }
                />
              </FormField>
              <FormField
                label={t("certifications")}
                htmlFor="certifications"
                hint={t("hintOnePerLine")}
              >
                <Textarea
                  id="certifications"
                  value={profileForm.certifications}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      certifications: event.target.value,
                    }))
                  }
                />
              </FormField>
              <FormField
                label={t("languages")}
                htmlFor="languages"
                hint={t("hintOnePerLine")}
              >
                <Textarea
                  id="languages"
                  value={profileForm.languages}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      languages: event.target.value,
                    }))
                  }
                />
              </FormField>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setProfileEditorOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={pendingAction === "profile"}>
                {pendingAction === "profile" ? (
                  <Loader2 className="animate-spin" />
                ) : null}{" "}
                {t("saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={skillEditorOpen}
        onOpenChange={(open) => {
          setSkillEditorOpen(open);
          if (!open) {
            setSkillOptions([]);
            setIsSkillMenuOpen(false);
            setSkillSuggestionStatus("idle");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addSkillTitle")}</DialogTitle>
            <DialogDescription>
              {t("addSkillDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addSkill} className="space-y-5">
            <FormField label={t("fieldSkillName")} htmlFor="skill-name">
              <div ref={skillPickerRef} className="relative">
                <Input
                  id="skill-name"
                  value={skillName}
                  maxLength={100}
                  required
                  role="combobox"
                  aria-autocomplete="list"
                  aria-controls="skill-suggestions"
                  aria-expanded={isSkillMenuOpen}
                  placeholder={t("skillSearchPlaceholder")}
                  onFocus={() => setIsSkillMenuOpen(true)}
                  onChange={(event) => {
                    setSkillName(event.target.value);
                    setIsSkillMenuOpen(true);
                  }}
                />
                {isSkillMenuOpen ? (
                  <div
                    id="skill-suggestions"
                    role="listbox"
                    aria-label={t("suggestedSkills")}
                    className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                  >
                    {skillSuggestionStatus === "loading" ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">
                        {t("loadingSuggestions")}
                      </p>
                    ) : null}
                    {skillSuggestionStatus === "error" ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">
                        {t("suggestionsError")}
                      </p>
                    ) : null}
                    {skillSuggestionStatus === "success" &&
                    availableSkillOptions.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">
                        {t("noSuggestions")}
                      </p>
                    ) : null}
                    {skillSuggestionStatus === "success"
                      ? availableSkillOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            role="option"
                            aria-selected={skillName === option.name}
                            className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                            onClick={() => {
                              setSkillName(option.name);
                              setIsSkillMenuOpen(false);
                            }}
                          >
                            {option.name}
                          </button>
                        ))
                      : null}
                  </div>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("skillSuggestionHint")}
              </p>
            </FormField>
            <FormField label={t("fieldProficiency")} htmlFor="skill-level">
              <Select
                value={skillLevel}
                onValueChange={(value) => value && setSkillLevel(value)}
              >
                <SelectTrigger id="skill-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, index) => index + 1).map(
                    (level) => (
                      <SelectItem key={level} value={String(level)}>
                        {level}/10 · {getProficiencyLabel(level)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </FormField>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSkillEditorOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={pendingAction === "skill-add"}>
                {pendingAction === "skill-add" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Plus />
                )}{" "}
                {t("saveSkill")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={portfolioEditor !== null}
        onOpenChange={(open) => !open && setPortfolioEditor(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {portfolioEditor === "new"
                ? t("addPortfolioTitle")
                : t("editPortfolioTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("portfolioFormDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={savePortfolio} className="space-y-5">
            <FormField label={t("fieldProjectTitle")} htmlFor="portfolio-title">
              <Input
                id="portfolio-title"
                value={portfolioForm.title}
                maxLength={255}
                required
                onChange={(event) =>
                  setPortfolioForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField label={t("fieldDescription")} htmlFor="portfolio-description">
              <Textarea
                id="portfolio-description"
                rows={5}
                maxLength={5000}
                value={portfolioForm.description}
                onChange={(event) =>
                  setPortfolioForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField
              label={t("fieldTechnologies")}
              htmlFor="portfolio-technologies"
              hint={t("hintTechnologies")}
            >
              <Input
                id="portfolio-technologies"
                value={portfolioForm.technologies}
                placeholder={t("technologiesPlaceholder")}
                onChange={(event) =>
                  setPortfolioForm((current) => ({
                    ...current,
                    technologies: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField label={t("fieldProjectUrl")} htmlFor="portfolio-url">
              <Input
                id="portfolio-url"
                type="url"
                value={portfolioForm.projectUrl}
                placeholder={t("projectUrlPlaceholder")}
                onChange={(event) =>
                  setPortfolioForm((current) => ({
                    ...current,
                    projectUrl: event.target.value,
                  }))
                }
              />
            </FormField>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPortfolioEditor(null)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={pendingAction === "portfolio-save"}
              >
                {pendingAction === "portfolio-save" ? (
                  <Loader2 className="animate-spin" />
                ) : null}{" "}
                {portfolioEditor === "new"
                  ? t("createPortfolio")
                  : t("saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={portfolioDetail !== null}
        onOpenChange={(open) => !open && setPortfolioDetail(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {portfolioDetail ? (
            <>
              <DialogHeader>
                <DialogTitle>{portfolioDetail.title}</DialogTitle>
                <DialogDescription>
                  {t("portfolioDetailDescription")}
                </DialogDescription>
              </DialogHeader>
              {isDetailLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {portfolioDetail.description || t("noDescription")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {portfolioDetail.technologies.map((technology) => (
                      <Badge key={technology} variant="secondary">
                        {technology}
                      </Badge>
                    ))}
                  </div>
                  {portfolioDetail.projectUrl ? (
                    <Button asChild>
                      <a
                        href={portfolioDetail.projectUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("visitProject")} <ExternalLink />
                      </a>
                    </Button>
                  ) : null}
                </div>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={skillToDelete !== null}
        title={t("deleteSkillTitle")}
        description={
          skillToDelete
            ? t("deleteSkillDescription", { name: skillToDelete.skill.name })
            : ""
        }
        pending={pendingAction === "skill-delete"}
        onOpenChange={(open) => !open && setSkillToDelete(null)}
        onConfirm={() => void deleteSkill()}
      />
      <DeleteDialog
        open={portfolioToDelete !== null}
        title={t("deletePortfolioTitle")}
        description={
          portfolioToDelete
            ? t("deletePortfolioDescription", {
                title: portfolioToDelete.title,
              })
            : ""
        }
        pending={pendingAction === "portfolio-delete"}
        onOpenChange={(open) => !open && setPortfolioToDelete(null)}
        onConfirm={() => void deletePortfolio()}
      />
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function DetailListCard({
  icon: Icon,
  title,
  items,
  empty,
}: {
  icon: typeof Award;
  title: string;
  items: string[] | null | undefined;
  empty: string;
}) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
        <Icon className="size-4 text-[#4fae2e]" /> {title}
      </h3>
      {items?.length ? (
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {items.map((item) => (
            <li key={item} className="flex gap-2 py-2.5 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#4fae2e]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  );
}

function DeleteDialog({
  open,
  title,
  description,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("freelancerProfile");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}{" "}
            {t("confirmDelete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
