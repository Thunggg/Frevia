"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Button } from "@repo/ui/components/shadcn/button";
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
import {
  Building2,
  ExternalLink,
  Heart,
  Link2,
  Loader2,
  Plus,
  Trash2,
  UserCheck,
  Globe2,
} from "@/components/icons";
import { accountProfileApi } from "@/apiRequests/account-profile";
import { ApiFail } from "@/lib/http";
import { FreelancerProfileSheet } from "@/app/(client)/_components/freelancer-profile-sheet";
import { VerifiedBadge } from "@/components/verified-badge";
import {
  SocialPlatform,
  type FavoriteFreelancerType,
  type FollowingFreelancerType,
  type SocialLinkType,
  type SocialPlatformType,
} from "@shared/types";

function errorMessage(error: unknown) {
  if (error instanceof ApiFail) {
    return error.response.error.details?.[0]?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

type TabKey = "company" | "social" | "favorites" | "following";

type ClientProfileSettingsProps = {
  userId: number;
};

export function ClientProfileSettings({ userId }: ClientProfileSettingsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "social" ||
      tabParam === "favorites" ||
      tabParam === "following"
    ) {
      return tabParam;
    }
    return "company";
  });

  const [socialLinks, setSocialLinks] = useState<SocialLinkType[]>([]);
  const [favorites, setFavorites] = useState<FavoriteFreelancerType[]>([]);
  const [following, setFollowing] = useState<FollowingFreelancerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  // Freelancer profile slide-over sheet
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [selectedProfileData, setSelectedProfileData] = useState<{
    displayName?: string | null;
    avatarUrl?: string | null;
    title?: string | null;
    freelancerId?: number;
  } | undefined>(undefined);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  const handleOpenProfile = (
    profileId: number,
    data?: {
      displayName?: string | null;
      avatarUrl?: string | null;
      title?: string | null;
      freelancerId?: number;
    },
  ) => {
    setSelectedProfileId(profileId);
    setSelectedProfileData(data);
    setIsProfileSheetOpen(true);
  };

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [platform, setPlatform] = useState<SocialPlatformType>(
    SocialPlatform.LINKEDIN,
  );
  const [socialUrl, setSocialUrl] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        profileResult,
        linksResult,
        favoritesResult,
        followingResult,
      ] = await Promise.allSettled([
        accountProfileApi.getClientProfile(userId),
        accountProfileApi.getSocialLinks(),
        accountProfileApi.getFavorites(),
        accountProfileApi.getFollowing(),
      ]);

      if (profileResult.status === "fulfilled") {
        const profile = profileResult.value.data;
        setCompanyName(profile.clientProfile.companyName ?? "");
        setCompanyDescription(profile.clientProfile.companyDescription ?? "");
        setWebsite(profile.clientProfile.website ?? "");
        if (linksResult.status !== "fulfilled" && profile.socialLinks) {
          setSocialLinks(profile.socialLinks);
        }
      } else {
        toastError({ message: errorMessage(profileResult.reason) });
      }

      if (linksResult.status === "fulfilled") {
        setSocialLinks(linksResult.value.data);
      }
      if (favoritesResult.status === "fulfilled") {
        setFavorites(favoritesResult.value.data);
      }
      if (followingResult.status === "fulfilled") {
        setFollowing(followingResult.value.data);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Sync tab change with URL query parameter
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "company") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    router.replace(`/client/profile${query}`, { scroll: false });
  };

  const handleSaveCompany = async (event: FormEvent) => {
    event.preventDefault();
    setPending("company");
    try {
      await accountProfileApi.updateClientProfile({
        companyName,
        companyDescription: companyDescription || null,
        website: website || null,
      });
      toastSuccess({ message: "Company information updated successfully." });
    } catch (error) {
      toastError({ message: errorMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const handleAddSocialLink = async (event: FormEvent) => {
    event.preventDefault();
    const existing = socialLinks.find((item) => item.platform === platform);
    if (existing) {
      toastError({
        message: `You already added a link for ${platform}. Please delete it first if you want to replace it.`,
      });
      return;
    }

    let urlToSubmit = socialUrl.trim();
    if (!urlToSubmit) return;
    if (!/^https?:\/\//i.test(urlToSubmit)) {
      urlToSubmit = `https://${urlToSubmit}`;
    }

    setPending("social");
    try {
      const response = await accountProfileApi.addSocialLink({
        platform,
        url: urlToSubmit,
      });
      setSocialLinks((current) => [...current, response.data]);
      setSocialUrl("");
      // Pick next unused platform
      const allPlatforms = Object.values(SocialPlatform);
      const remaining = allPlatforms.filter(
        (p) => p !== platform && !socialLinks.some((item) => item.platform === p),
      );
      if (remaining.length > 0 && remaining[0]) {
        setPlatform(remaining[0]);
      }
      toastSuccess({ message: "Social link added." });
    } catch (error) {
      toastError({ message: errorMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const handleDeleteSocialLink = async (linkId: number) => {
    setPending(`social-${linkId}`);
    try {
      await accountProfileApi.deleteSocialLink(linkId);
      setSocialLinks((current) => current.filter((item) => item.id !== linkId));
      toastSuccess({ message: "Social link removed." });
    } catch (error) {
      toastError({ message: errorMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const handleRemoveFavorite = async (freelancerId: number) => {
    setPending(`favorite-${freelancerId}`);
    try {
      await accountProfileApi.removeFavorite(freelancerId);
      setFavorites((current) =>
        current.filter((item) => item.freelancerId !== freelancerId),
      );
      toastSuccess({ message: "Freelancer removed from favorites." });
    } catch (error) {
      toastError({ message: errorMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const handleUnfollowFreelancer = async (freelancerId: number) => {
    setPending(`following-${freelancerId}`);
    try {
      await accountProfileApi.unfollowFreelancer(freelancerId);
      setFollowing((current) =>
        current.filter((item) => item.freelancerId !== freelancerId),
      );
      toastSuccess({ message: "Freelancer unfollowed." });
    } catch (error) {
      toastError({ message: errorMessage(error) });
    } finally {
      setPending(null);
    }
  };

  const tabs = [
    { id: "company" as const, label: "Company Profile", icon: Building2 },
    {
      id: "social" as const,
      label: "Social Links",
      icon: Link2,
      count: socialLinks.length,
    },
    {
      id: "favorites" as const,
      label: "Favorite Freelancers",
      icon: Heart,
      count: favorites.length,
    },
    {
      id: "following" as const,
      label: "Following",
      icon: UserCheck,
      count: following.length,
    },
  ];

  return (
    <div className="min-h-full bg-background font-sans">
      <div className="mx-auto w-full max-w-5xl px-6 pt-8 pb-12 lg:px-8">
        {/* ── Page Header ── */}
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-sans">
              Profile Settings
            </h1>
          </div>

          <Button
            variant="outline"
            asChild
            className="self-start sm:self-auto gap-2 rounded-full border-black/10 dark:border-white/10 hover:bg-[#D0E1F8]/50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-foreground text-xs px-4 py-2 transition-colors cursor-pointer"
          >
            <Link href={`/clients/${userId}`} target="_blank">
              <Globe2 className="size-3.5 text-[#0069D3]" />
              <span>View public profile</span>
              <ExternalLink className="size-3 opacity-60 ml-0.5" />
            </Link>
          </Button>
        </div>

        {/* ── Capsule Tab Bar ── */}
        <div className="mt-6 flex overflow-x-auto pb-1 scrollbar-none">
          {/* Đổi thành flex w-full */}
          <div className="flex w-full p-0.5 rounded-full bg-[#F3F3F7] dark:bg-zinc-900/90 dark:border-white/10 shadow-xs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex flex-1 justify-center items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${isActive
                    ? "bg-white dark:bg-zinc-800 text-[#0069D3] dark:text-blue-200 shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-zinc-800/60 font-medium"
                    }`}
                >
                  <Icon className="size-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 ? (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${isActive
                        ? "bg-[#D0E1F8] text-[#0069D3] dark:bg-[#0069D3]/30 dark:text-blue-200"
                        : "bg-black/5 dark:bg-white/10 text-muted-foreground"
                        }`}
                    >
                      {tab.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="mt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="size-8 animate-spin text-[#0069D3]" />
              <p className="text-xs text-muted-foreground">Loading profile settings...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* 1. Company Profile Tab */}
              {activeTab === "company" && (
                <motion.div
                  key="company"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-[26px] border border-border dark:border-white/10 bg-card p-6 sm:p-8 shadow-xs"
                >
                  <div className="flex items-center gap-3 border-b border-border pb-5">
                    <div className="flex size-10 items-center justify-center rounded-full   text-[#0069D3]">
                      <Building2 className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground font-sans">
                        Company Details
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        This information will be displayed on your public profile and job postings.
                      </p>
                    </div>
                  </div>

                  <form className="mt-6 space-y-5" onSubmit={handleSaveCompany}>
                    <div className="space-y-2">
                      <Label htmlFor="company-name" className="text-xs font-semibold">
                        Company Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="company-name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        maxLength={255}
                        placeholder="e.g. Acme Studio Inc."
                        className="h-10 rounded-full px-4 text-xs sm:text-sm border border-black/5 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-[#0069D3]/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company-desc" className="text-xs font-semibold">
                        Company Description
                      </Label>
                      <Textarea
                        id="company-desc"
                        rows={5}
                        value={companyDescription}
                        onChange={(e) => setCompanyDescription(e.target.value)}
                        placeholder="Describe your company, industry, and the kind of work you do..."
                        className="rounded-2xl p-4 text-xs sm:text-sm border border-black/5 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-[#0069D3]/30 leading-relaxed resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company-website" className="text-xs font-semibold">
                        Website URL
                      </Label>
                      <Input
                        id="company-website"
                        type="url"
                        placeholder="https://yourcompany.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="h-10 rounded-full px-4 text-xs sm:text-sm border border-black/5 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-[#0069D3]/30"
                      />
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <Button
                        type="submit"
                        disabled={pending === "company" || !companyName.trim()}
                        className="gap-2 rounded-full bg-[#0069D3] text-white hover:bg-[#0058b3] px-6 py-2.5 text-xs sm:text-sm font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {pending === "company" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        Save changes
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* 2. Social Links Tab */}
              {activeTab === "social" && (
                <motion.div
                  key="social"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-6 lg:grid-cols-[380px_1fr]"
                >
                  {/* Add link card */}
                  <div className="rounded-[26px] border border-black/5 dark:border-white/10 bg-card p-6 sm:p-7 shadow-xs">
                    <div className="flex items-center gap-2.5 border-b border-border pb-4">
                      <div className="flex size-8 items-center justify-center rounded-full bg-[#D0E1F8] dark:bg-[#0069D3]/20 text-[#0069D3]">
                        <Plus className="size-4" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground font-sans">
                        Add Social Link
                      </h3>
                    </div>

                    <form className="mt-5 space-y-4" onSubmit={handleAddSocialLink}>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Platform</Label>
                        <Select
                          value={platform}
                          onValueChange={(value) =>
                            setPlatform(value as SocialPlatformType)
                          }
                        >
                          <SelectTrigger className="h-10 rounded-full px-4 text-xs sm:text-sm border border-black/5 dark:border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            {Object.values(SocialPlatform).map((val) => {
                              const alreadyAdded = socialLinks.some(
                                (item) => item.platform === val,
                              );
                              return (
                                <SelectItem
                                  key={val}
                                  value={val}
                                  disabled={alreadyAdded}
                                >
                                  {val.replaceAll("_", " ")}{" "}
                                  {alreadyAdded ? "(Already added)" : ""}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Profile URL</Label>
                        <Input
                          type="url"
                          required
                          placeholder="https://..."
                          value={socialUrl}
                          onChange={(e) => setSocialUrl(e.target.value)}
                          className="h-10 rounded-full px-4 text-xs sm:text-sm border border-black/5 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-[#0069D3]/30"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={pending === "social" || !socialUrl.trim()}
                        className="w-full gap-1.5 rounded-full bg-[#0069D3] text-white hover:bg-[#0058b3] text-xs font-semibold py-2.5 cursor-pointer shadow-xs"
                      >
                        {pending === "social" ? (
                          <Loader2 className="size-3.5 animate-spin mr-1" />
                        ) : (
                          <Plus className="size-3.5 mr-1" />
                        )}
                        Add link
                      </Button>
                    </form>
                  </div>

                  {/* Existing links list */}
                  <div className="rounded-[26px] border border-black/5 dark:border-white/10 bg-card p-6 sm:p-7 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <h3 className="text-sm font-bold text-foreground font-sans">
                        Connected Links ({socialLinks.length})
                      </h3>
                    </div>

                    {socialLinks.length === 0 ? (
                      <div className="py-16 text-center">
                        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[#F1F0F5] dark:bg-zinc-800 text-muted-foreground">
                          <Link2 className="size-5" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          No social links connected yet.
                        </p>
                      </div>
                    ) : (
                      <ul className="mt-3 divide-y divide-border">
                        {socialLinks.map((link) => (
                          <li
                            key={link.id}
                            className="flex items-center justify-between gap-3 py-3 px-1"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#D0E1F8] dark:bg-[#0069D3]/20 text-[#0069D3]">
                                <Link2 className="size-3.5" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-foreground">
                                  {link.platform}
                                </p>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="truncate text-xs text-[#0069D3] hover:underline flex items-center gap-1"
                                >
                                  <span className="truncate">{link.url}</span>
                                  <ExternalLink className="size-2.5 shrink-0 opacity-70" />
                                </a>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={pending === `social-${link.id}`}
                              onClick={() => handleDeleteSocialLink(link.id)}
                              className="size-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                              title="Delete link"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              )}

              {/* 3. Favorites Tab */}
              {activeTab === "favorites" && (
                <motion.div
                  key="favorites"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className=""
                >
                  {favorites.length === 0 ? (
                    <div className="py-20 text-center">
                      <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full text-[#0069D3]">
                        <Heart className="size-6" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground">
                        No favorite freelancers yet
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                        Explore freelancer profiles and tap the heart icon to save them here for quick access.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {favorites.map((favorite) => (
                        <div
                          key={favorite.freelancerId}
                          className="flex flex-col justify-between rounded-[22px] border border-black/5 dark:border-white/10 p-4 transition-all hover:border-black/15 dark:hover:border-white/20 hover:shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div
                              onClick={() =>
                                handleOpenProfile(favorite.profile.id, {
                                  displayName: favorite.profile.displayName,
                                  avatarUrl: favorite.profile.avatarUrl,
                                  title:
                                    favorite.profile.freelancerProfile.title,
                                  freelancerId: favorite.freelancerId,
                                })
                              }
                              className="flex items-center gap-3 min-w-0 cursor-pointer group"
                            >
                              <Avatar className="size-10 rounded-full shrink-0 ring-2 ring-transparent group-hover:ring-[#0069D3]/30 transition-all">
                                {favorite.profile.avatarUrl ? (
                                  <AvatarImage
                                    src={favorite.profile.avatarUrl}
                                    alt={favorite.profile.displayName ?? "Freelancer"}
                                  />
                                ) : null}
                                <AvatarFallback className="bg-[#D0E1F8] text-xs font-bold text-[#0069D3]">
                                  {(favorite.profile.displayName ?? "F")
                                    .charAt(0)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="truncate text-xs sm:text-sm font-bold text-foreground group-hover:text-[#0069D3] transition-colors">
                                    {favorite.profile.displayName ?? "Freelancer"}
                                  </p>
                                  {favorite.profile.freelancerProfile.idVerified ? (
                                    <VerifiedBadge size="xs" />
                                  ) : null}
                                </div>
                                <p className="truncate text-xs text-muted-foreground">
                                  {favorite.profile.freelancerProfile.title ??
                                    "Freelancer"}
                                </p>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={pending === `favorite-${favorite.freelancerId}`}
                              onClick={() =>
                                handleRemoveFavorite(favorite.freelancerId)
                              }
                              className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                              title="Remove from favorites"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>

                          {/* Skills */}
                          <div className="mt-3 flex flex-wrap gap-1">
                            {favorite.profile.freelancerProfile.skills
                              .slice(0, 3)
                              .map((skill) => (
                                <span
                                  key={skill.id}
                                  className="rounded-full bg-[#D0E1F8]/60 dark:bg-[#0069D3]/20 text-[#0069D3] dark:text-blue-200 px-2 py-0.5 text-[10px] font-medium"
                                >
                                  {skill.skillName}
                                </span>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* 4. Following Tab */}
              {activeTab === "following" && (
                <motion.div
                  key="following"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className=""
                >

                  {following.length === 0 ? (
                    <div className="py-20 text-center">
                      <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-[#D0E1F8] dark:bg-[#0069D3]/20 text-[#0069D3]">
                        <UserCheck className="size-6" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground">
                        Not following anyone yet
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                        Follow freelancers to keep their profiles easy to find and monitor.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {following.map((follow) => (
                        <div
                          key={follow.freelancerId}
                          className="flex flex-col justify-between rounded-[22px] border border-black/5 dark:border-white/10 p-4 transition-all hover:border-black/15 dark:hover:border-white/20 hover:shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div
                              onClick={() =>
                                handleOpenProfile(follow.profile.id, {
                                  displayName: follow.profile.displayName,
                                  avatarUrl: follow.profile.avatarUrl,
                                  title: follow.profile.freelancerProfile.title,
                                  freelancerId: follow.freelancerId,
                                })
                              }
                              className="flex items-center gap-3 min-w-0 cursor-pointer group"
                            >
                              <Avatar className="size-10 rounded-full shrink-0 ring-2 ring-transparent group-hover:ring-[#0069D3]/30 transition-all">
                                {follow.profile.avatarUrl ? (
                                  <AvatarImage
                                    src={follow.profile.avatarUrl}
                                    alt={follow.profile.displayName ?? "Freelancer"}
                                  />
                                ) : null}
                                <AvatarFallback className="bg-[#D0E1F8] text-xs font-bold text-[#0069D3]">
                                  {(follow.profile.displayName ?? "F")
                                    .charAt(0)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="truncate text-xs sm:text-sm font-bold text-foreground group-hover:text-[#0069D3] transition-colors">
                                    {follow.profile.displayName ?? "Freelancer"}
                                  </p>
                                  {follow.profile.freelancerProfile.idVerified ? (
                                    <VerifiedBadge size="xs" />
                                  ) : null}
                                </div>
                                <p className="truncate text-xs text-muted-foreground">
                                  {follow.profile.freelancerProfile.title ??
                                    "Freelancer"}
                                </p>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={pending === `following-${follow.freelancerId}`}
                              onClick={() =>
                                handleUnfollowFreelancer(follow.freelancerId)
                              }
                              className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                              title="Unfollow freelancer"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>

                          {/* Skills */}
                          <div className="mt-3 flex flex-wrap gap-1">
                            {follow.profile.freelancerProfile.skills
                              .slice(0, 3)
                              .map((skill) => (
                                <span
                                  key={skill.id}
                                  className="rounded-full bg-[#D0E1F8]/60 dark:bg-[#0069D3]/20 text-[#0069D3] dark:text-blue-200 px-2 py-0.5 text-[10px] font-medium"
                                >
                                  {skill.skillName}
                                </span>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Slide-over full freelancer profile sheet */}
      <FreelancerProfileSheet
        open={isProfileSheetOpen}
        onOpenChange={setIsProfileSheetOpen}
        profileId={selectedProfileId}
        initialData={selectedProfileData}
      />
    </div>
  );
}
