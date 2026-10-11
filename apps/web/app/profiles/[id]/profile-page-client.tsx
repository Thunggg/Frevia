"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
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
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import { accountProfileApi } from "@/apiRequests/account-profile";
import { profileApiRequest } from "@/apiRequests/profile";
import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { ApiFail } from "@/lib/http";
import {
  AvailabilityStatus,
  type AvailabilityStatusType,
  type FreelancerProfileDetailType,
  type FreelancerSkillType,
  type PortfolioItemType,
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
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
  mediaUrls: string;
  projectUrl: string;
};

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
  mediaUrls: "",
  projectUrl: "",
};

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

function getInitials(displayName: string | null) {
  return (displayName ?? "Freelancer")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getProficiencyLabel(level: number) {
  if (level >= 8) return "Expert";
  if (level >= 4) return "Intermediate";
  return "Beginner";
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
      <UserRound className="mx-auto size-8 text-[#4fae2e]" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function ProfilePageClient({
  profileId,
  currentUserId,
  headerRole,
}: ProfilePageClientProps) {
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

  const isOwner = Boolean(profile && currentUserId === profile.userId);

  const loadProfile = useCallback(async () => {
    if (!Number.isInteger(profileId) || profileId <= 0) {
      setLoadError("Freelancer profile not found.");
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
      ] = await Promise.all([
        profileApiRequest.getProfileDetail(profileId),
        profileApiRequest.getSkills(profileId),
        profileApiRequest.getPortfoliosList(profileId),
        headerRole === "CLIENT"
          ? accountProfileApi.getFavorites()
          : Promise.resolve(null),
      ]);

      if (
        !profileResponse.success ||
        !skillsResponse.success ||
        !portfoliosResponse.success
      ) {
        throw new Error("Unable to load freelancer profile.");
      }

      setProfile(profileResponse.data);
      setSkills(skillsResponse.data);
      setPortfolios(portfoliosResponse.data);
      setIsFavorite(
        favoritesResponse?.data.some(
          (favorite) => favorite.freelancerId === profileResponse.data.userId,
        ) ?? false,
      );
    } catch (error) {
      setLoadError(
        getErrorMessage(
          error,
          "Unable to load profile details. Please try again later.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [headerRole, profileId]);

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
          ? "Freelancer removed from favorites."
          : "Freelancer added to favorites.",
      });
    } catch (error) {
      toastError({
        message: getErrorMessage(error, "Unable to update favorites."),
      });
    } finally {
      setPendingAction(null);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const completionItems = useMemo(() => {
    if (!profile) return [];
    return [
      Boolean(profile.displayName),
      Boolean(profile.bio),
      Boolean(profile.freelancerProfile?.title),
      Boolean(profile.freelancerProfile?.education?.length),
      Boolean(profile.freelancerProfile?.certifications?.length),
      skills.length > 0,
      portfolios.length > 0,
    ];
  }, [profile, skills.length, portfolios.length]);
  const completion = completionItems.length
    ? Math.round(
        (completionItems.filter(Boolean).length / completionItems.length) * 100,
      )
    : 0;

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
        message: "Display name and professional title are required.",
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
      if (!response.success) throw new Error("Profile update failed.");
      setProfile(response.data);
      setProfileEditorOpen(false);
      toastSuccess({ message: "Profile updated successfully." });
    } catch (error) {
      toastError({
        message: getErrorMessage(
          error,
          "Profile update failed. Please try again later.",
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
      toastError({ message: "Please select a skill and a proficiency level." });
      return;
    }
    if (
      skills.some(
        (skill) =>
          skill.skillName.toLowerCase() === normalizedName.toLowerCase(),
      )
    ) {
      toastError({
        message: "This skill has already been added to your profile.",
      });
      return;
    }

    setPendingAction("skill-add");
    try {
      const response = await profileApiRequest.addSkill(profileId, {
        skillName: normalizedName,
        proficiencyLevel,
      });
      if (!response.success) throw new Error("Unable to add skill.");
      setSkills((current) =>
        [...current, response.data].sort((first, second) =>
          first.skillName.localeCompare(second.skillName),
        ),
      );
      setSkillName("");
      setSkillLevel("5");
      setSkillEditorOpen(false);
      toastSuccess({ message: "Skill added successfully." });
    } catch (error) {
      toastError({
        message: getErrorMessage(
          error,
          "Unable to add skill. Please try again later.",
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
      toastSuccess({ message: "Skill removed successfully." });
    } catch (error) {
      toastError({
        message: getErrorMessage(
          error,
          "Unable to remove skill. Please try again later.",
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
            mediaUrls: portfolio.mediaUrls.join("\n"),
            projectUrl: portfolio.projectUrl ?? "",
          },
    );
  };

  const savePortfolio = async (event: FormEvent) => {
    event.preventDefault();
    if (!portfolioEditor || !portfolioForm.title.trim()) {
      toastError({ message: "Portfolio title is required." });
      return;
    }

    const body: UpdatePortfolioType = {
      title: portfolioForm.title,
      description: portfolioForm.description || null,
      technologies: splitValues(portfolioForm.technologies),
      mediaUrls: splitValues(portfolioForm.mediaUrls),
      projectUrl: portfolioForm.projectUrl || null,
    };

    setPendingAction("portfolio-save");
    try {
      if (portfolioEditor === "new") {
        const response = await profileApiRequest.addPortfolio(profileId, body);
        if (!response.success) throw new Error("Unable to create portfolio.");
        setPortfolios((current) => [response.data, ...current]);
        toastSuccess({ message: "Portfolio created successfully." });
      } else {
        const response = await profileApiRequest.updatePortfolio(
          portfolioEditor.id,
          body,
        );
        if (!response.success) throw new Error("Unable to update portfolio.");
        setPortfolios((current) =>
          current.map((portfolio) =>
            portfolio.id === portfolioEditor.id ? response.data : portfolio,
          ),
        );
        setPortfolioDetail((current) =>
          current?.id === response.data.id ? response.data : current,
        );
        toastSuccess({ message: "Portfolio updated successfully." });
      }
      setPortfolioEditor(null);
    } catch (error) {
      toastError({
        message: getErrorMessage(
          error,
          "Unable to save portfolio. Please try again later.",
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
        message: getErrorMessage(error, "Unable to load portfolio details."),
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
      toastSuccess({ message: "Portfolio deleted successfully." });
    } catch (error) {
      toastError({
        message: getErrorMessage(
          error,
          "Unable to delete portfolio. Please try again later.",
        ),
      });
    } finally {
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header role={headerRole} />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" /> Loading freelancer
            profile...
          </div>
        </main>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header role={headerRole} />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 text-center">
          <UserRound className="size-12 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">
            Freelancer profile unavailable
          </h1>
          <p className="mt-2 text-muted-foreground">{loadError}</p>
          <Button className="mt-6" onClick={() => void loadProfile()}>
            <RefreshCw /> Try again
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const freelancer = profile.freelancerProfile;

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={headerRole} />
      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="transition-colors hover:text-[#4fae2e]">
                Home
              </Link>
              <span className="mx-2 text-foreground/35">/</span>
              <span className="font-medium text-foreground">
                Freelancer profile
              </span>
            </nav>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {profile.displayName ?? "Unnamed freelancer"}
            </h1>
            <p className="mt-2 text-base text-foreground/70 dark:text-foreground/75">
              {freelancer?.title ?? "Professional title not added"}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
                        alt={profile.displayName ?? "Freelancer"}
                      />
                    ) : null}
                    <AvatarFallback className="bg-[#eaf8df] text-2xl font-bold text-[#4fae2e] dark:bg-[#4fae2e]/15">
                      {getInitials(profile.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        {profile.displayName ?? "Unnamed freelancer"}
                      </h2>
                      {freelancer?.idVerified ? (
                        <Badge className="gap-1 border-transparent bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
                          <ShieldCheck className="size-3" /> Verified
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-lg text-muted-foreground">
                      {freelancer?.title ?? "Professional title not added"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-1.5">
                        <span
                          className={`size-2 rounded-full ${profile.availabilityStatus === AvailabilityStatus.AVAILABLE ? "bg-[#4fae2e]" : "bg-amber-500"}`}
                        />
                        {profile.availabilityStatus.toLowerCase()}
                      </Badge>
                      {profile.onlineStatus ? (
                        <Badge variant="secondary">Online now</Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
                {isOwner ? (
                  <Button
                    className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                    onClick={openProfileEditor}
                  >
                    <Pencil /> Edit profile
                  </Button>
                ) : headerRole === "CLIENT" ? (
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
                    {isFavorite ? "Favorited" : "Add to favorites"}
                  </Button>
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
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="skills">
                  Skills ({skills.length})
                </TabsTrigger>
                <TabsTrigger value="portfolio">
                  Portfolio ({portfolios.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-5 space-y-8">
                <section>
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    About me
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {profile.bio ||
                      "This freelancer has not added a bio yet."}
                  </p>
                </section>
                <div className="grid gap-8 md:grid-cols-2">
                  <DetailListCard
                    icon={GraduationCap}
                    title="Education"
                    items={freelancer?.education}
                    empty="No education added yet."
                  />
                  <DetailListCard
                    icon={Award}
                    title="Certifications"
                    items={freelancer?.certifications}
                    empty="No certifications added yet."
                  />
                </div>
                <DetailListCard
                  icon={Languages}
                  title="Languages"
                  items={freelancer?.languages}
                  empty="No languages added yet."
                />
              </TabsContent>

              <TabsContent value="skills" className="mt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      Professional skills
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Skill names and proficiency levels.
                    </p>
                  </div>
                  {isOwner ? (
                    <Button
                      size="sm"
                      className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                      onClick={() => setSkillEditorOpen(true)}
                    >
                      <Plus /> Add skill
                    </Button>
                  ) : null}
                </div>
                {skills.length === 0 ? (
                  <div className="mt-5">
                    <SectionEmpty
                      title="No skills added yet"
                      description={
                        isOwner
                          ? "Add your first skill to help clients understand your expertise."
                          : "This freelancer has not added any skills."
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
                                {skill.skillName}
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
                                aria-label={`Delete ${skill.skillName}`}
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
                      Portfolio
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Selected projects, work samples and technologies.
                    </p>
                  </div>
                  {isOwner ? (
                    <Button
                      size="sm"
                      className="bg-[#4fae2e] text-white hover:bg-[#459928]"
                      onClick={() => openPortfolioEditor("new")}
                    >
                      <Plus /> Add portfolio
                    </Button>
                  ) : null}
                </div>
                {portfolios.length === 0 ? (
                  <div className="mt-5">
                    <SectionEmpty
                      title="No portfolios available"
                      description={
                        isOwner
                          ? "Showcase your work by adding a portfolio project."
                          : "This freelancer has not published a portfolio yet."
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
                          <div
                            className="h-36 w-full shrink-0 rounded-lg bg-[#eaf8df] bg-cover bg-center sm:h-28 sm:w-40 dark:bg-[#1a1c1a]"
                            style={
                              portfolio.mediaUrls[0]
                                ? {
                                    backgroundImage: `url(${portfolio.mediaUrls[0]})`,
                                  }
                                : undefined
                            }
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold tracking-tight text-foreground transition-colors group-hover:text-[#4fae2e]">
                              {portfolio.title}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {portfolio.description ||
                                "No description provided."}
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
                              <Pencil /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => setPortfolioToDelete(portfolio)}
                            >
                              <Trash2 /> Delete
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
                  Profile strength
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {completion}% complete
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[#4fae2e]"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Complete your bio, professional details, skills and portfolio
                  to stand out.
                </p>
              </div>
              <div className="rounded-xl border border-border p-5 sm:p-6">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  At a glance
                </h3>
                <ul className="mt-4 divide-y divide-border text-sm">
                  <li className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="size-4 text-[#4fae2e]" />{" "}
                      Availability
                    </span>
                    <span className="font-medium capitalize">
                      {profile.availabilityStatus.toLowerCase()}
                    </span>
                  </li>
                  <li className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Award className="size-4 text-[#4fae2e]" /> Skills
                    </span>
                    <span className="font-medium">{skills.length}</span>
                  </li>
                  <li className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <BriefcaseBusiness className="size-4 text-[#4fae2e]" />{" "}
                      Projects
                    </span>
                    <span className="font-medium">{portfolios.length}</span>
                  </li>
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
            <DialogTitle>Edit detailed profile</DialogTitle>
            <DialogDescription>
              Update your public personal and professional information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={updateProfile} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Display name" htmlFor="display-name">
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
                label="Professional title"
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
            <FormField label="Bio" htmlFor="profile-bio">
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
            <FormField label="Availability" htmlFor="availability">
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
                      {status.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                label="Education"
                htmlFor="education"
                hint="One item per line"
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
                label="Certifications"
                htmlFor="certifications"
                hint="One item per line"
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
                label="Languages"
                htmlFor="languages"
                hint="One item per line"
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
                Cancel
              </Button>
              <Button type="submit" disabled={pendingAction === "profile"}>
                {pendingAction === "profile" ? (
                  <Loader2 className="animate-spin" />
                ) : null}{" "}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={skillEditorOpen} onOpenChange={setSkillEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add freelancer skill</DialogTitle>
            <DialogDescription>
              Add a unique skill and select your proficiency level.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addSkill} className="space-y-5">
            <FormField label="Skill name" htmlFor="skill-name">
              <Input
                id="skill-name"
                value={skillName}
                maxLength={100}
                required
                placeholder="e.g. Product design"
                onChange={(event) => setSkillName(event.target.value)}
              />
            </FormField>
            <FormField label="Proficiency level" htmlFor="skill-level">
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
                Cancel
              </Button>
              <Button type="submit" disabled={pendingAction === "skill-add"}>
                {pendingAction === "skill-add" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Plus />
                )}{" "}
                Save skill
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
              {portfolioEditor === "new" ? "Add portfolio" : "Edit portfolio"}
            </DialogTitle>
            <DialogDescription>
              Add project details, technologies and public media links.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={savePortfolio} className="space-y-5">
            <FormField label="Project title" htmlFor="portfolio-title">
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
            <FormField label="Description" htmlFor="portfolio-description">
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
              label="Technologies"
              htmlFor="portfolio-technologies"
              hint="Comma-separated, up to 20"
            >
              <Input
                id="portfolio-technologies"
                value={portfolioForm.technologies}
                placeholder="Next.js, NestJS, PostgreSQL"
                onChange={(event) =>
                  setPortfolioForm((current) => ({
                    ...current,
                    technologies: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField
              label="Media URLs"
              htmlFor="portfolio-media"
              hint="One public image or document URL per line, up to 10"
            >
              <Textarea
                id="portfolio-media"
                value={portfolioForm.mediaUrls}
                placeholder="https://example.com/project-cover.png"
                onChange={(event) =>
                  setPortfolioForm((current) => ({
                    ...current,
                    mediaUrls: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField label="Project URL" htmlFor="portfolio-url">
              <Input
                id="portfolio-url"
                type="url"
                value={portfolioForm.projectUrl}
                placeholder="https://example.com/project"
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
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={pendingAction === "portfolio-save"}
              >
                {pendingAction === "portfolio-save" ? (
                  <Loader2 className="animate-spin" />
                ) : null}{" "}
                {portfolioEditor === "new"
                  ? "Create portfolio"
                  : "Save changes"}
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
                <DialogDescription>Portfolio project details</DialogDescription>
              </DialogHeader>
              {isDetailLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {portfolioDetail.mediaUrls.length ? (
                      portfolioDetail.mediaUrls.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="h-48 rounded-xl border bg-muted bg-cover bg-center"
                          style={{ backgroundImage: `url(${url})` }}
                          aria-label="Open portfolio media"
                        />
                      ))
                    ) : (
                      <div className="col-span-full flex h-40 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                        No media attached.
                      </div>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {portfolioDetail.description || "No description provided."}
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
                        Visit project <ExternalLink />
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
        title="Delete this skill?"
        description={
          skillToDelete
            ? `${skillToDelete.skillName} will be permanently removed from your profile.`
            : ""
        }
        pending={pendingAction === "skill-delete"}
        onOpenChange={(open) => !open && setSkillToDelete(null)}
        onConfirm={() => void deleteSkill()}
      />
      <DeleteDialog
        open={portfolioToDelete !== null}
        title="Delete this portfolio?"
        description={
          portfolioToDelete
            ? `${portfolioToDelete.title} will be removed from your public portfolio.`
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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}{" "}
            Confirm delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
