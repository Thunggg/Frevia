"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@repo/ui/components/shadcn/sheet";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Button } from "@repo/ui/components/shadcn/button";
import { VerifiedBadge } from "@/components/verified-badge";
import {
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  Code2,
  ExternalLink,
  GraduationCap,
  Languages,
  Loader2,
  MessageSquare,
  Sparkles,
  UserRound,
} from "@/components/icons";
import { profileApiRequest } from "@/apiRequests/profile";
import { useCreateConversation } from "@/hooks/use-conversation";
import type {
  FreelancerProfileDetailType,
  FreelancerSkillType,
  PortfolioItemType,
} from "@shared/types";

interface FreelancerProfileSheetProps {
  profileId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    displayName?: string | null;
    avatarUrl?: string | null;
    title?: string | null;
    freelancerId?: number;
  };
}

type TabType = "overview" | "portfolio" | "qualifications";

export function FreelancerProfileSheet({
  profileId,
  open,
  onOpenChange,
  initialData,
}: FreelancerProfileSheetProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [profile, setProfile] = useState<FreelancerProfileDetailType | null>(
    null,
  );
  const [skills, setSkills] = useState<FreelancerSkillType[]>([]);
  const [portfolios, setPortfolios] = useState<PortfolioItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createConversation = useCreateConversation();
  const [isStartingChat, setIsStartingChat] = useState(false);



  const loadData = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, skillsRes, portfoliosRes] = await Promise.allSettled([
        profileApiRequest.getProfileDetail(id),
        profileApiRequest.getSkills(id),
        profileApiRequest.getPortfoliosList(id),
      ]);

      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value.data);
      } else {
        setError("Could not load full freelancer details.");
      }

      if (skillsRes.status === "fulfilled") {
        setSkills(skillsRes.value.data);
      }

      if (portfoliosRes.status === "fulfilled") {
        setPortfolios(portfoliosRes.value.data);
      }
    } catch {
      setError("An unexpected error occurred while loading profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && profileId) {
      void loadData(profileId);
      setActiveTab("overview");
    } else if (!open) {
      setProfile(null);
      setSkills([]);
      setPortfolios([]);
      setError(null);
    }
  }, [open, profileId, loadData]);

  const displayName =
    profile?.displayName || initialData?.displayName || "Freelancer";
  const title =
    profile?.freelancerProfile?.title ||
    initialData?.title ||
    "Freelancer";
  const avatarUrl = profile?.avatarUrl || initialData?.avatarUrl || undefined;
  const isOnline = profile?.onlineStatus ?? false;
  const isVerified = profile?.freelancerProfile?.idVerified ?? false;
  const userId = profile?.userId || initialData?.freelancerId;

  const handleMessage = async () => {
    if (!userId) return;
    setIsStartingChat(true);
    try {
      const conv = await createConversation.mutateAsync(userId);
      onOpenChange(false);
      router.push(`/client/conversations/${conv.id}`);
    } catch {
      onOpenChange(false);
      router.push(`/client/conversations?userId=${userId}`);
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl overflow-hidden p-0 flex flex-col gap-0 border-l border-border bg-background shadow-2xl z-50 font-sans"
      >
        {/* Accessible hidden header for screen readers */}
        <SheetHeader className="sr-only">
          <SheetTitle>{displayName} Profile</SheetTitle>
          <SheetDescription>
            Detailed freelancer profile overview, skills, and portfolio.
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto">
          {/* Subtle Clean Header Banner */}
          <div className="relative">
            <div
              className="h-28 sm:h-32 w-full bg-cover bg-center relative bg-muted/40 dark:bg-zinc-900/60"
              style={
                profile?.coverUrl
                  ? { backgroundImage: `url(${profile.coverUrl})` }
                  : undefined
              }
            />

            {/* Avatar & Quick Actions Row */}
            <div className="px-6 relative -mt-10 sm:-mt-12 flex items-end justify-between gap-4">
              <div className="relative">
                <Avatar className="size-20 sm:size-22 rounded-full border-3 border-background shadow-md bg-card">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-muted text-foreground text-lg font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOnline && (
                  <span
                    className="absolute bottom-1 right-1 size-3.5 rounded-full bg-emerald-500 border-2 border-background"
                    title="Online"
                  />
                )}
              </div>

              {/* Top Quick Actions */}
              <div className="flex items-center gap-2 pb-1">
                {userId ? (
                  <Button
                    size="sm"
                    className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold px-4 h-8 gap-1.5 shadow-xs cursor-pointer"
                    disabled={isStartingChat}
                    onClick={() => void handleMessage()}
                  >
                    {isStartingChat ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <MessageSquare className="size-3.5" />
                    )}
                    <span>{isStartingChat ? "Opening..." : "Message"}</span>
                  </Button>
                ) : null}

                {profileId ? (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="rounded-full border-border hover:bg-muted text-foreground text-xs font-medium px-3 h-8 gap-1 cursor-pointer"
                  >
                    <Link href={`/profiles/${profileId}`} target="_blank">
                      <ExternalLink className="size-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline">Open full</span>
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Identity Info */}
            <div className="px-6 pt-3 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {displayName}
                </h2>
                {isVerified && <VerifiedBadge size="sm" />}
              </div>

              <p className="mt-0.5 text-xs sm:text-sm font-medium text-muted-foreground">
                {title}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {profile?.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    Joined {new Date(profile.createdAt).getFullYear()}
                  </span>
                )}
                {profile?.profileCompletionPercent ? (
                  <span className="flex items-center gap-1">
                    <Sparkles className="size-3.5 text-muted-foreground" />
                    {profile.profileCompletionPercent}% profile completion
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Clean Underline Tab Navigation */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-y border-border/70 px-6">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "overview"
                    ? "border-[#0069D3] text-[#0069D3]"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserRound className="size-3.5" />
                <span>Overview & Skills</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("portfolio")}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "portfolio"
                    ? "border-[#0069D3] text-[#0069D3]"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Briefcase className="size-3.5" />
                <span>Portfolio</span>
                {portfolios.length > 0 && (
                  <span className="rounded-full bg-muted text-foreground px-1.5 py-0.2 text-[10px] font-bold">
                    {portfolios.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("qualifications")}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "qualifications"
                    ? "border-[#0069D3] text-[#0069D3]"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <GraduationCap className="size-3.5" />
                <span>Qualifications</span>
              </button>
            </div>
          </div>

          {/* Tab Contents */}
          <div className="p-6">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <Loader2 className="size-7 animate-spin text-muted-foreground" />
                <p className="mt-3 text-xs text-muted-foreground">
                  Loading freelancer details...
                </p>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-destructive/20 p-5 text-center">
                <p className="text-sm font-medium text-destructive">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => profileId && void loadData(profileId)}
                  className="mt-3 rounded-full text-xs"
                >
                  Try again
                </Button>
              </div>
            ) : (
              <>
                {/* ── Tab: Overview & Skills ── */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Bio */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        About Freelancer
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                        {profile?.bio ||
                          "No introduction provided by this freelancer yet."}
                      </p>
                    </div>

                    {/* Skills */}
                    <div className="pt-2 border-t border-border/60">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Skills ({skills.length})
                      </h3>
                      {skills.length === 0 ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          No skills listed yet.
                        </p>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {skills.map((skill) => (
                            <div
                              key={skill.id}
                              className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-2.5 py-1 text-xs text-foreground"
                            >
                              <Code2 className="size-3 text-muted-foreground" />
                              <span>{skill.skill.name}</span>
                              <span className="text-[11px] text-muted-foreground">
                                · Lv.{skill.proficiencyLevel}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Languages */}
                    {profile?.freelancerProfile?.languages &&
                      profile.freelancerProfile.languages.length > 0 && (
                        <div className="pt-2 border-t border-border/60">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Languages
                          </h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {profile.freelancerProfile.languages.map(
                              (lang, idx) => (
                                <div
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-2.5 py-1 text-xs text-muted-foreground"
                                >
                                  <Languages className="size-3 text-muted-foreground" />
                                  <span>{lang}</span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* ── Tab: Portfolio ── */}
                {activeTab === "portfolio" && (
                  <div className="space-y-4">
                    {portfolios.length === 0 ? (
                      <div className="py-14 text-center rounded-xl border border-dashed border-border">
                        <Briefcase className="mx-auto size-7 text-muted-foreground/50" />
                        <h4 className="mt-2 text-xs font-semibold text-foreground">
                          No portfolio items
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          This freelancer has not published any portfolio projects yet.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {portfolios.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-border/80 bg-background p-4 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="text-sm font-semibold text-foreground">
                                {item.title}
                              </h4>
                              {item.projectUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="h-7 px-2 text-xs text-[#0069D3] hover:bg-muted"
                                >
                                  <a
                                    href={item.projectUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1"
                                  >
                                    <span>Link</span>
                                    <ExternalLink className="size-3" />
                                  </a>
                                </Button>
                              )}
                            </div>

                            {item.description && (
                              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                {item.description}
                              </p>
                            )}

                            {item.technologies &&
                              item.technologies.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                  {item.technologies.map((tech, i) => (
                                    <span
                                      key={i}
                                      className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-medium"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Tab: Qualifications ── */}
                {activeTab === "qualifications" && (
                  <div className="space-y-6">
                    {/* Education */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="size-4 text-muted-foreground" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Education
                        </h3>
                      </div>
                      {!profile?.freelancerProfile?.education ||
                      profile.freelancerProfile.education.length === 0 ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          No education listed.
                        </p>
                      ) : (
                        <div className="mt-2 divide-y divide-border/60">
                          {profile.freelancerProfile.education.map(
                            (edu, idx) => (
                              <div
                                key={idx}
                                className="py-2.5 flex items-start gap-2.5"
                              >
                                <p className="text-xs text-foreground font-medium leading-relaxed">
                                  {edu}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>

                    {/* Certifications */}
                    <div className="pt-2 border-t border-border/60">
                      <div className="flex items-center gap-1.5">
                        <Award className="size-4 text-muted-foreground" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Certifications
                        </h3>
                      </div>
                      {!profile?.freelancerProfile?.certifications ||
                      profile.freelancerProfile.certifications.length === 0 ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          No certifications listed.
                        </p>
                      ) : (
                        <div className="mt-2 divide-y divide-border/60">
                          {profile.freelancerProfile.certifications.map(
                            (cert, idx) => (
                              <div
                                key={idx}
                                className="py-2.5 flex items-start gap-2.5"
                              >
                                <CheckCircle2 className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-xs text-foreground font-medium leading-relaxed">
                                  {cert}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
