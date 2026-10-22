"use client";

import {
  useCreatePortfolioItem,
  useDeletePortfolioItem,
  useUpdatePortfolioItem,
} from "@/hooks/use-admin-user";
import { ApiFail } from "@/lib/http";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { Input } from "@repo/ui/components/shadcn/input";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  ManageUserMessage,
  type AdminCreatePortfolioItemBodyType,
  type AdminUpdatePortfolioItemBodyType,
  type AdminUserDetailResponseType,
  type AdminUserPortfolioItemType,
} from "@shared/types";
import {
  ExternalLink,
  FolderGit2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

// ====== Dialog quản lý portfolio (tab FREELANCER - User Detail) ======
// Hai chế độ: 'list' (xem danh sách item + nút Add/Edit/Delete)
// và 'form' (form thêm mới hoặc sửa 1 item: title/description/technologies/projectUrl).
interface FormState {
  id: number | null;
  title: string;
  description: string;
  technologiesText: string;
  projectUrl: string;
}

const EMPTY_FORM: FormState = {
  id: null,
  title: "",
  description: "",
  technologiesText: "",
  projectUrl: "",
};

// Chuyển chuỗi "React, Node.js" → mảng ["React", "Node.js"]
function toTechnologies(raw: string): string[] {
  return raw
    .split(",")
    .map((tech) => tech.trim())
    .filter(Boolean);
}

function parseTechList(item: Pick<AdminUserPortfolioItemType, "technologies">) {
  return (item.technologies ?? []).join(", ");
}

interface ManageFreelancerPortfolioButtonProps {
  user: AdminUserDetailResponseType;
}

export function ManageFreelancerPortfolioButton({
  user,
}: ManageFreelancerPortfolioButtonProps) {
  const router = useRouter();
  const t = useTranslations("adminUserProfileEdit");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"list" | "form">("list");
  const [formState, setFormState] = useState<FormState>(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] =
    useState<AdminUserPortfolioItemType | null>(null);

  const createItem = useCreatePortfolioItem();
  const updateItem = useUpdatePortfolioItem();
  const deleteItem = useDeletePortfolioItem();

  const items = user.freelancerProfile?.portfolioItems ?? [];
  const busy =
    createItem.isPending || updateItem.isPending || deleteItem.isPending;

  function startAdd() {
    setFormState(EMPTY_FORM);
    setMode("form");
  }

  function startEdit(item: AdminUserPortfolioItemType) {
    setFormState({
      id: item.id,
      title: item.title,
      description: item.description ?? "",
      technologiesText: parseTechList(item),
      projectUrl: item.projectUrl ?? "",
    });
    setMode("form");
  }

  function cancelForm() {
    setMode("list");
    setFormState(EMPTY_FORM);
  }

  function isValidUrl(value: string): boolean {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  // Lưu (thêm mới hoặc cập nhật): validate title/URL, gọi API tương ứng
  function onSave() {
    const title = formState.title.trim();
    if (!title) {
      toastError({ message: ManageUserMessage.PORTFOLIO_TITLE_REQUIRED });
      return;
    }
    const description =
      formState.description.trim() === "" ? null : formState.description.trim();
    const technologies = toTechnologies(formState.technologiesText);
    const projectUrl =
      formState.projectUrl.trim() === "" ? null : formState.projectUrl.trim();
    if (projectUrl && !isValidUrl(projectUrl)) {
      toastError({ message: ManageUserMessage.INVALID_URL });
      return;
    }

    if (formState.id === null) {
      const body: AdminCreatePortfolioItemBodyType = {
        title,
        description,
        technologies,
        projectUrl,
      };
      createItem.mutate(
        { id: user.id, body },
        {
          onSuccess: () => {
            toastSuccess({ message: t("portfolioCreated") });
            cancelForm();
            router.refresh();
          },
          onError: (error) =>
            toastError({
              message: errorMessage(error, t("portfolioCreateFailed")),
            }),
        },
      );
      return;
    }

    const original = items.find((item) => item.id === formState.id);
    const body: AdminUpdatePortfolioItemBodyType = {};
    if (original) {
      if (title !== original.title) body.title = title;
      if (description !== (original.description ?? null)) {
        body.description = description;
      }
      if (
        JSON.stringify(technologies) !==
        JSON.stringify(original.technologies ?? [])
      ) {
        body.technologies = technologies;
      }
      if (projectUrl !== (original.projectUrl ?? null)) {
        body.projectUrl = projectUrl;
      }
    }
    if (Object.keys(body).length === 0) {
      cancelForm();
      return;
    }

    updateItem.mutate(
      { id: user.id, itemId: formState.id, body },
      {
        onSuccess: () => {
          toastSuccess({ message: t("portfolioUpdated") });
          cancelForm();
          router.refresh();
        },
        onError: (error) =>
          toastError({
            message: errorMessage(error, t("portfolioUpdateFailed")),
          }),
      },
    );
  }

  function errorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiFail) {
      const details = error.response.error.details ?? [];
      if (details.length > 0 && details[0]) return details[0].message;
      return error.message;
    }
    return fallback;
  }

  // Xoá item (soft-delete): mở dialog xác nhận trước khi gọi API
  function onRequestDelete(item: AdminUserPortfolioItemType) {
    setPendingDelete(item);
  }

  function onConfirmDelete() {
    const item = pendingDelete;
    if (!item) return;
    setPendingDelete(null);

    deleteItem.mutate(
      { id: user.id, itemId: item.id },
      {
        onSuccess: () => {
          toastSuccess({ message: t("portfolioDeleted") });
          if (formState.id === item.id) cancelForm();
          router.refresh();
        },
        onError: (error) =>
          toastError({
            message: errorMessage(error, t("portfolioDeleteFailed")),
          }),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 hover:bg-purple-500/10 hover:text-purple-500 hover:border-purple-400/40 transition-colors"
        >
          <FolderGit2 className="h-3.5 w-3.5" />
          {t("portfolioTrigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderGit2 className="h-5 w-5 text-purple-500" />
            {t("portfolioTitle")}
          </DialogTitle>
          <DialogDescription>
            {t.rich("portfolioDescription", {
              b: (chunks) => (
                <span className="font-medium text-foreground">{chunks}</span>
              ),
              email: user.email,
            })}
          </DialogDescription>
        </DialogHeader>

        {mode === "form" ? (
          <div className="space-y-3">
            <Input
              value={formState.title}
              onChange={(e) =>
                setFormState((s) => ({ ...s, title: e.target.value }))
              }
              placeholder={t("portfolioTitlePlaceholder")}
              autoFocus
            />
            <Textarea
              value={formState.description}
              onChange={(e) =>
                setFormState((s) => ({ ...s, description: e.target.value }))
              }
              placeholder={t("portfolioDescriptionPlaceholder")}
              rows={3}
            />
            <Input
              value={formState.technologiesText}
              onChange={(e) =>
                setFormState((s) => ({
                  ...s,
                  technologiesText: e.target.value,
                }))
              }
              placeholder={t("portfolioTechnologiesPlaceholder")}
            />
            <Input
              value={formState.projectUrl}
              onChange={(e) =>
                setFormState((s) => ({ ...s, projectUrl: e.target.value }))
              }
              type="url"
              placeholder={t("portfolioUrlPlaceholder")}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={cancelForm}>
                {t("cancel")}
              </Button>
              <Button type="button" onClick={onSave} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {formState.id === null
                  ? t("portfolioAddAction")
                  : t("saveChanges")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {t("portfolioItemsShown", { count: items.length })}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startAdd}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t("portfolioAddAction")}
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
                {t("portfolioEmpty")}
              </p>
            ) : (
              <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border bg-card p-3 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {item.title}
                        </p>
                        {item.description ? (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.projectUrl && (
                          <a
                            href={item.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label={t("portfolioOpenUrlAria", { title: item.title })}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => startEdit(item)}
                          aria-label={t("portfolioEditAria", {
                            title: item.title,
                          })}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => onRequestDelete(item)}
                          aria-label={t("portfolioDeleteAria", {
                            title: item.title,
                          })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {item.technologies && item.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
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
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            {t("portfolioClose")}
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("portfolioDeleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("portfolioDeleteHint", {
                title: pendingDelete?.title ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={deleteItem.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirmDelete}
              disabled={deleteItem.isPending}
            >
              {deleteItem.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {t("portfolioDeleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
