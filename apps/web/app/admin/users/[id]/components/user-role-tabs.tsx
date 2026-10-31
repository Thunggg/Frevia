"use client";

import { useState } from "react";
import {
  Building,
  UserCheck,
  Shield,
  ExternalLink,
  Code2,
  GraduationCap,
  Award,
  Languages,
  FolderGit2,
  CheckCircle,
  XCircle,
  BrainCircuit,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/shadcn/tabs";
import { Badge } from "@repo/ui/components/shadcn/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import type { AdminUserDetailResponseType } from "@shared/types";
import { useTranslations } from "next-intl";
import { EditClientProfileButton } from "./edit-client-profile-button";
import { EditFreelancerProfileButton } from "./edit-freelancer-profile-button";
import { ManageFreelancerSkillsButton } from "./manage-freelancer-skills-button";
import { ManageFreelancerPortfolioButton } from "./manage-freelancer-portfolio-button";
import { EditExpertProfileButton } from "./edit-expert-profile-button";

interface UserRoleTabsProps {
  user: AdminUserDetailResponseType;
}

export function UserRoleTabs({ user }: UserRoleTabsProps) {
  const t = useTranslations("adminUserDetail");
  const tCommon = useTranslations("adminCommon");

  const hasClientProfile =
    Boolean(user.clientProfile) ||
    user.roles.some((r) => r.name.toLowerCase() === "client");

  const hasFreelancerProfile =
    Boolean(user.freelancerProfile) ||
    user.roles.some((r) => r.name.toLowerCase() === "freelancer");

  const hasExpertProfile =
    Boolean(user.expertProfile) ||
    user.roles.some((r) => r.name.toLowerCase() === "expert");

  const customRoles = user.customRoleProfiles;
  const hasAdminOrCustomRoles =
    customRoles.length > 0 ||
    user.roles.some(
      (r) =>
        r.name.toLowerCase() !== "client" &&
        r.name.toLowerCase() !== "freelancer" &&
        r.name.toLowerCase() !== "expert",
    );

  // Determine initial tab
  const primaryRole = user.roles.find((r) => r.isPrimary)?.name.toLowerCase();
  let defaultTab = "overview";
  if (primaryRole === "expert" && hasExpertProfile) {
    defaultTab = "expert";
  } else if (primaryRole === "freelancer" && hasFreelancerProfile) {
    defaultTab = "freelancer";
  } else if (primaryRole === "client" && hasClientProfile) {
    defaultTab = "client";
  } else if (hasFreelancerProfile) {
    defaultTab = "freelancer";
  } else if (hasClientProfile) {
    defaultTab = "client";
  } else if (hasAdminOrCustomRoles) {
    defaultTab = "roles";
  }

  const [activeTab, setActiveTab] = useState(defaultTab);

  const renderMethodBadge = (method: string) => {
    const m = method.toUpperCase();
    if (m === "GET") {
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 font-mono text-xs"
        >
          GET
        </Badge>
      );
    }
    if (m === "POST") {
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 font-mono text-xs"
        >
          POST
        </Badge>
      );
    }
    if (m === "PUT" || m === "PATCH") {
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 font-mono text-xs"
        >
          {m}
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 font-mono text-xs"
      >
        {m}
      </Badge>
    );
  };

  const renderJsonList = (data: unknown) => {
    if (!data) return null;
    if (Array.isArray(data)) {
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {data.map((item, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {typeof item === "string" ? item : JSON.stringify(item)}
            </Badge>
          ))}
        </div>
      );
    }
    return (
      <p className="text-xs text-muted-foreground mt-1">
        {JSON.stringify(data)}
      </p>
    );
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-lg font-bold text-foreground">
          {t("rolesTitle")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t("rolesDescription")}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
          {hasClientProfile && (
            <TabsTrigger value="client" className="flex items-center gap-1.5">
              <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              {t("tabClient")}
            </TabsTrigger>
          )}

          {hasFreelancerProfile && (
            <TabsTrigger
              value="freelancer"
              className="flex items-center gap-1.5"
            >
              <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              {t("tabFreelancer")}
            </TabsTrigger>
          )}

          {hasExpertProfile && (
            <TabsTrigger value="expert" className="flex items-center gap-1.5">
              <BrainCircuit className="h-4 w-4 text-[#4fae2e]" />
              {t("tabExpert")}
            </TabsTrigger>
          )}

          {hasAdminOrCustomRoles && (
            <TabsTrigger value="roles" className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              {t("tabRoles")}
            </TabsTrigger>
          )}
        </TabsList>

        {/* 1. Client Profile Tab Content */}
        {hasClientProfile && (
          <TabsContent value="client" className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {t("clientSectionTitle")}
              </h3>
              <EditClientProfileButton user={user} />
            </div>
            {user.clientProfile ? (
              <div className="space-y-6">
                <div className="rounded-lg border p-5 bg-muted/20 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        {user.clientProfile.companyName ||
                          t("independentClient")}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t("clientProfileId", { id: user.clientProfile.id })}
                      </p>
                    </div>

                    {user.clientProfile.website && (
                      <a
                        href={user.clientProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#4fae2e] hover:underline"
                      >
                        {t("visitWebsite")}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("companyOverview")}
                    </h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {user.clientProfile.companyDescription ||
                        t("noCompanyDescription")}
                    </p>
                  </div>
                </div>

                {/* Client Activity Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 bg-card">
                    <p className="text-xs text-muted-foreground">
                      {t("clientJobsPosted")}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {user.stats.jobsPosted}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 bg-card">
                    <p className="text-xs text-muted-foreground">
                      {t("clientContracts")}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {user.stats.contractsAsClient}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground border rounded-lg border-dashed">
                {t("clientNoProfile")}
              </div>
            )}
          </TabsContent>
        )}

        {/* 2. Freelancer Profile Tab Content */}
        {hasFreelancerProfile && (
          <TabsContent value="freelancer" className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                {t("freelancerSectionTitle")}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <EditFreelancerProfileButton user={user} />
                <ManageFreelancerSkillsButton user={user} />
                <ManageFreelancerPortfolioButton user={user} />
              </div>
            </div>
            {user.freelancerProfile ? (
              <div className="space-y-6">
                {/* Title & Verification status */}
                <div className="rounded-lg border p-5 bg-muted/20 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3">
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        {user.freelancerProfile.title ||
                          t("freelancerFallbackTitle")}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t("profileId", { id: user.freelancerProfile.id })}
                      </p>
                    </div>

                    <div>
                      {user.freelancerProfile.idVerified ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-1.5"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />{" "}
                          {t("identityVerified")}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 flex items-center gap-1.5"
                        >
                          <XCircle className="h-3.5 w-3.5" />{" "}
                          {t("identityNotVerified")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Skills Grid */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Code2 className="h-3.5 w-3.5 text-[#4fae2e]" />
                      {t("skillsTitle")}
                    </h4>
                    {user.freelancerProfile.skills.length === 0 ? (
                      <p className="text-xs italic text-muted-foreground">
                        {t("noSkills")}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {user.freelancerProfile.skills.map((skill) => (
                          <Badge
                            key={skill.id}
                            variant="outline"
                            className="bg-background py-1 px-2.5 text-xs flex items-center gap-2 border-border"
                          >
                            <span className="font-medium text-foreground">
                              {skill.skill.name}
                            </span>
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {t("skillLevel", {
                                level: skill.proficiencyLevel,
                              })}
                            </span>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Meta: Languages, Education, Certifications */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Languages className="h-3.5 w-3.5" />
                        {t("languages")}
                      </h5>
                      {renderJsonList(user.freelancerProfile.languages) || (
                        <p className="text-xs italic text-muted-foreground mt-1">
                          {t("notAdded")}
                        </p>
                      )}
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {t("education")}
                      </h5>
                      {renderJsonList(user.freelancerProfile.education) || (
                        <p className="text-xs italic text-muted-foreground mt-1">
                          {t("notAdded")}
                        </p>
                      )}
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" />
                        {t("certifications")}
                      </h5>
                      {renderJsonList(
                        user.freelancerProfile.certifications,
                      ) || (
                        <p className="text-xs italic text-muted-foreground mt-1">
                          {t("notAdded")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Portfolio Items */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FolderGit2 className="h-4 w-4 text-[#4fae2e]" />
                    {t("portfolioTitle", {
                      count: user.freelancerProfile.portfolioItems.length,
                    })}
                  </h4>

                  {user.freelancerProfile.portfolioItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
                      {t("noPortfolioItems")}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.freelancerProfile.portfolioItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border bg-card p-4 shadow-sm flex flex-col justify-between space-y-3 hover:border-border transition-colors"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-semibold text-sm text-foreground">
                                {item.title}
                              </h5>
                              {item.projectUrl && (
                                <a
                                  href={item.projectUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#4fae2e] hover:text-[#4fae2e]/80"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-3">
                              {item.description ||
                                t("noProjectDescription")}
                            </p>
                          </div>

                          {item.technologies &&
                            item.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-2 border-t">
                                {item.technologies.map((tech, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground border rounded-lg border-dashed">
                {t("freelancerNoProfile")}
              </div>
            )}
          </TabsContent>
        )}

        {hasExpertProfile && (
          <TabsContent value="expert" className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <BrainCircuit className="h-4 w-4 text-[#4fae2e]" />
                {t("expertSectionTitle")}
              </h3>
              <EditExpertProfileButton user={user} />
            </div>
            {user.expertProfile ? (
              <div className="space-y-5 rounded-lg border bg-muted/20 p-5">
                <div className="border-b pb-4">
                  <h3 className="text-base font-bold">
                    {user.expertProfile.title || t("expertFallbackTitle")}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                    {user.bio || t("noProfessionalBio")}
                  </p>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("expertise")}
                    </p>
                    {renderJsonList(user.expertProfile.expertise) || (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("notAdded")}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("experience")}
                    </p>
                    <p className="mt-1 text-sm">
                      {user.expertProfile.yearsOfExperience == null
                        ? t("notAdded")
                        : t("yearsOfExperience", {
                            years: user.expertProfile.yearsOfExperience,
                          })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("education")}
                    </p>
                    {renderJsonList(user.expertProfile.education) || (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("notAdded")}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("certifications")}
                    </p>
                    {renderJsonList(user.expertProfile.certifications) || (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("notAdded")}
                      </p>
                    )}
                  </div>
                </div>
                {user.expertProfile.website && (
                  <a
                    href={user.expertProfile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-[#4fae2e] hover:underline"
                  >
                    {t("expertWebsite")} <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                {t("expertNoProfile")}
              </div>
            )}
          </TabsContent>
        )}

        {/* Admin & Custom Roles Tab Content */}
        {hasAdminOrCustomRoles && (
          <TabsContent value="roles" className="mt-6 space-y-6">
            {customRoles.length === 0 ? (
              <div className="rounded-lg border p-5 bg-muted/20 space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-600" />
                  {t("systemRoleTitle")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("systemRoleDescription")}
                </p>
              </div>
            ) : (
              customRoles.map((cr) => (
                <div
                  key={cr.roleId}
                  className="rounded-lg border bg-card p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">
                          {t("roleLabel", { name: cr.roleName })}
                        </h3>
                        {cr.isPrimary && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-700 border-amber-300"
                          >
                            {t("primaryRole")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {cr.description || t("noRoleDescription")}
                      </p>
                    </div>

                    <Badge variant="secondary" className="text-xs">
                      {t("permissionCount", { count: cr.permissions.length })}
                    </Badge>
                  </div>

                  {/* Permissions table */}
                  {cr.permissions.length === 0 ? (
                    <p className="text-xs italic text-muted-foreground py-2">
                      {t("noPermissionsForRole")}
                    </p>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40">
                            <TableHead className="w-[80px]">
                              {tCommon("method")}
                            </TableHead>
                            <TableHead>{t("colApiPath")}</TableHead>
                            <TableHead>{t("colPermissionName")}</TableHead>
                            <TableHead className="w-[120px]">
                              {tCommon("module")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cr.permissions.map((perm) => (
                            <TableRow key={perm.id}>
                              <TableCell>
                                {renderMethodBadge(perm.method)}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-foreground">
                                {perm.path}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {perm.name}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-mono"
                                >
                                  {perm.module || t("generalModule")}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
