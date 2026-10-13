"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { adminApiRequest } from "@/apiRequests/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Separator } from "@repo/ui/components/shadcn/separator";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/shadcn/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Label } from "@repo/ui/components/shadcn/label";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastSuccess, toastError } from "@repo/ui/components/shadcn/toast";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import {
  Eye,
  User,
  Calendar,
  FileCheck,
  FileX,
  Clock,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { AdminPagination } from "../../components/admin-pagination";
import type { IdentityVerificationAdminListResponseType } from "@shared/types";

type DocumentItem = IdentityVerificationAdminListResponseType["documents"][number];

interface IdentityVerificationsTableProps {
  documents: DocumentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  currentStatus?: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  PENDING: {
    label: "Pending",
    color:
      "border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    color:
      "border-[#4fae2e]/30 bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rejected",
    color: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: XCircle,
  },
};

const documentTypeLabels: Record<string, string> = {
  PASSPORT: "Passport",
  ID_CARD: "ID Card",
  DRIVER_LICENSE: "Driver License",
  RESIDENCE_PERMIT: "Residence Permit",
  OTHER: "Other",
};

export function IdentityVerificationsTable({
  documents,
  pagination,
  currentStatus,
}: IdentityVerificationsTableProps) {
  const router = useRouter();
  const [viewing, setViewing] = useState<DocumentItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams();
      if (value && value !== "all") params.set("status", value);
      router.push(`?${params.toString()}`);
    },
    [router],
  );

  const openDetail = (document: DocumentItem) => {
    setViewing(document);
    setReviewNotes(document.reviewNotes ?? "");
    setActing(null);
  };

  const handleAction = async (document: DocumentItem, action: "approve" | "reject") => {
    setActing(action);
    try {
      if (action === "approve") {
        await adminApiRequest.approveIdentityVerification(
          document.id,
          reviewNotes.trim() || null,
        );
        toastSuccess({ message: "Identity verification approved" });
      } else {
        await adminApiRequest.rejectIdentityVerification(
          document.id,
          reviewNotes.trim() || null,
        );
        toastSuccess({ message: "Identity verification rejected" });
      }
      setViewing(null);
      router.refresh();
    } catch {
      toastError({ message: "Couldn't update the request. Try again." });
    } finally {
      setActing(null);
    }
  };

  const displayStatus = currentStatus || "all";

  return (
    <div className="space-y-4">
      <Tabs value={displayStatus} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {Object.entries(statusConfig).map(([key, config]) => (
            <TabsTrigger key={key} value={key}>
              {config.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  No verification requests found.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((document) => {
                const config = statusConfig[document.status];
                const StatusIcon = config?.icon ?? Clock;
                return (
                  <TableRow key={document.id} className="group">
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {document.id}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={
                              document.user.profile?.avatarUrl ?? undefined
                            }
                          />
                          <AvatarFallback className="text-[10px]">
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <span className="text-sm text-foreground">
                            {document.user.profile?.displayName ??
                              `User #${document.user.id}`}
                          </span>
                          <span className="text-xs text-muted-foreground block truncate">
                            {document.user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {documentTypeLabels[document.documentType] ??
                        document.documentType}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${config?.color} border`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {new Date(document.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openDetail(document)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <AdminPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
        />
      )}

      <Dialog
        open={!!viewing}
        onOpenChange={(open) => !open && setViewing(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-8">
              <ShieldCheck className="h-4 w-4 text-[#4fae2e]" />
              ID Verification Request #{viewing?.id}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={viewing.user.profile?.avatarUrl ?? undefined}
                    />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {viewing.user.profile?.displayName ??
                        `User #${viewing.user.id}`}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {viewing.user.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-border bg-muted">
                    {documentTypeLabels[viewing.documentType] ??
                      viewing.documentType}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`${statusConfig[viewing.status]?.color} border`}
                  >
                    {statusConfig[viewing.status]?.label}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Submitted{" "}
                {new Date(viewing.createdAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Document
                </p>
                <div className="overflow-hidden rounded-lg border bg-muted/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewing.fileUrl}
                    alt="Identity document"
                    className="max-h-[320px] w-full object-contain"
                  />
                </div>
              </div>

              {viewing.reviewNotes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                    Review Notes
                  </p>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {viewing.reviewNotes}
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              {viewing.status === "PENDING" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="review-notes">Review Notes</Label>
                    <Textarea
                      id="review-notes"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Optional..."
                      rows={3}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      disabled={acting === "reject"}
                      onClick={() => handleAction(viewing, "reject")}
                    >
                      <FileX className="h-4 w-4 mr-1.5" />
                      {acting === "reject" ? "Rejecting..." : "Reject"}
                    </Button>
                    <Button
                      disabled={acting === "approve"}
                      onClick={() => handleAction(viewing, "approve")}
                    >
                      <FileCheck className="h-4 w-4 mr-1.5" />
                      {acting === "approve" ? "Approving..." : "Approve"}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}