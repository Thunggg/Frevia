import adminServerRequest from "@/apiRequests/admin.server";
import authServerRequest from "@/apiRequests/auth.server";
import { hasActionPermission } from "@/lib/admin-access";
import { NumberedPagination } from "@/app/admin/components/numbered-pagination";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Scale } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { DisputesTable } from "./components/disputes-table";

export async function generateMetadata() {
  const t = await getTranslations("adminDisputes");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const status = params.status || undefined;

  const t = await getTranslations("adminDisputes");
  const currentUser = await authServerRequest.getMe();
  const canViewList = hasActionPermission(
    currentUser,
    "GET",
    "/api/admin/disputes",
  );

  if (!canViewList) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#4fae2e]/10 text-[#4fae2e]">
              <Scale className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t("pageTitle")}
              </h1>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          {t("accessDenied")}
        </div>
      </div>
    );
  }

  const response = await adminServerRequest.getDisputes(page, 10, status);

  const disputes = response?.data ?? [];
  const pagination = response?.pagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };

  const statusTabs = [
    { label: t("tabAll", { count: pagination.total }), value: undefined },
    { label: t("tabOpen"), value: "OPEN" },
    { label: t("tabWaitingResponse"), value: "WAITING_RESPONSE" },
    { label: t("tabUnderReview"), value: "UNDER_REVIEW" },
    { label: t("tabDecisionMade"), value: "DECISION_MADE" },
    { label: t("tabReviewRequested"), value: "REVIEW_REQUESTED" },
    { label: t("tabFinalized"), value: "FINALIZED" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#4fae2e]/10 text-[#4fae2e]">
            <Scale className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("pageTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("pageSubtitle", { total: pagination.total })}
            </p>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {statusTabs.map((tab) => {
          const isActive = status === tab.value;
          const href = tab.value ? `?status=${tab.value}` : "/admin/disputes";

          return (
            <Link key={tab.label} href={href}>
              <Badge
                variant={isActive ? "default" : "outline"}
                className={`cursor-pointer px-3 py-1.5 text-xs transition-colors ${
                  isActive
                    ? "bg-[#4fae2e] text-white hover:bg-[#439626]"
                    : "hover:bg-muted"
                }`}
              >
                {tab.label}
              </Badge>
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <DisputesTable disputes={disputes} />

      {/* Pagination */}
      <NumberedPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
      />
    </div>
  );
}

