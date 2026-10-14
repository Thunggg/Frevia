"use client";

import {
  useReplaceFreelancerSkills,
  useSkillCatalog,
} from "@/hooks/use-admin-user";
import { ApiFail } from "@/lib/http";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  ManageUserMessage,
  type AdminUserDetailResponseType,
} from "@shared/types";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// ====== Dialog quản lý kỹ năng (tab FREELANCER - User Detail) ======
// - Kỹ năng được CHỌN từ catalog Skill (Select) thay vì gõ tay.
// - Mỗi dòng = skill + proficiency (1-10); Save gửi nguyên danh sách → server thay thế toàn bộ.
interface SkillRow {
  key: string;
  skillName: string;
  proficiencyLevel: number;
}

interface ManageFreelancerSkillsButtonProps {
  user: AdminUserDetailResponseType;
}

export function ManageFreelancerSkillsButton({
  user,
}: ManageFreelancerSkillsButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<SkillRow[]>([]); // Đây là danh sách skills đang được chỉnh sửa trên UI.
  const [nextKey, setNextKey] = useState(0); // Dùng để tạo key riêng cho mỗi row mới.
  const replaceSkills = useReplaceFreelancerSkills(); // Hook gọi API để thay thế toàn bộ danh sách skills.
  const { data: catalog = [], isLoading: catalogLoading } =
    useSkillCatalog(open); // Hook để lấy danh sách kỹ năng từ catalog.

  useEffect(() => {
    if (open) {
      setRows(
        (user.freelancerProfile?.skills ?? []).map((skill) => ({
          key: `existing-${skill.id}`,
          skillName: skill.skillName,
          proficiencyLevel: skill.proficiencyLevel,
        })),
      );
      setNextKey(0);
    }
  }, [open, user.freelancerProfile]);

  // Options = skill active trong catalog + giữ lại các skill cũ user đang có
  // (tránh làm mất skill "custom" chưa tồn tại trong catalog).
  const optionNames = useMemo(() => {
    const byLower = new Map<string, string>();
    // Lấy tất cả các skill trong catalog
    for (const skill of catalog) {
      byLower.set(skill.name.toLowerCase(), skill.name);
    }
    // Thêm các skill cũ user đang có
    for (const row of rows) {
      const trimmed = row.skillName.trim();
      if (trimmed && !byLower.has(trimmed.toLowerCase())) {
        byLower.set(trimmed.toLowerCase(), trimmed);
      }
    }
    return Array.from(byLower.values()).sort((a, b) => a.localeCompare(b));
  }, [catalog, rows]);

  // lưu lại trạng thái skills hiện tại từ server, để lát nữa so sánh xem user có thay đổi gì chưa
  const serverList = useMemo(() => {
    const source = user.freelancerProfile?.skills ?? [];
    return JSON.stringify(
      source.map((s) => ({
        skillName: s.skillName.trim(),
        proficiencyLevel: s.proficiencyLevel,
      })),
    );
  }, [user.freelancerProfile]);

  // so sánh danh sách skills trên UI với danh sách skills từ server để xem có thay đổi gì không
  const hasChanges = useMemo(() => {
    const normalized = rows
      .filter((r) => r.skillName.trim() !== "")
      .map((r) => ({
        skillName: r.skillName.trim(),
        proficiencyLevel: r.proficiencyLevel,
      }));
    return JSON.stringify(normalized) !== serverList;
  }, [rows, serverList]);

  // kiểm tra xem có row nào có cùng tên skill không (trừ row hiện tại)
  const isUsedByAnotherRow = (rowKey: string, name: string) =>
    rows.some((r) => r.key !== rowKey && r.skillName === name);

  // cập nhật row
  const updateRow = (key: string, patch: Partial<SkillRow>) => {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  };

  // Thêm một row mới để nhập skill
  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { key: `new-${nextKey}`, skillName: "", proficiencyLevel: 5 },
    ]);
    setNextKey((k) => k + 1);
  };

  // xóa row
  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((row) => row.key !== key));
  };

  // Lưu: kiểm tra level hợp lệ (1-10) rồi thay thế toàn bộ danh sách
  function onSave() {
    const hasBadLevel = rows.some(
      (r) =>
        !Number.isInteger(r.proficiencyLevel) ||
        r.proficiencyLevel < 1 ||
        r.proficiencyLevel > 10,
    );
    if (hasBadLevel) {
      toastError({ message: ManageUserMessage.SKILL_LEVEL_INVALID });
      return;
    }
    if (!hasChanges) {
      setOpen(false);
      return;
    }

    const skills = rows
      .filter((r) => r.skillName.trim() !== "")
      .map((r) => ({
        skillName: r.skillName.trim(),
        proficiencyLevel: r.proficiencyLevel,
      }));

    replaceSkills.mutate(
      {
        id: user.id,
        body: { skills },
      },
      {
        onSuccess: () => {
          toastSuccess({
            message: `Skills updated (${skills.length}) for "${user.email}"`,
          });
          setOpen(false);
          router.refresh();
        },
        onError: (error) => {
          if (error instanceof ApiFail) {
            const details = error.response.error.details ?? [];
            if (details.length === 0) {
              toastError({ message: error.message });
              return;
            }
            const first = details[0];
            if (first) {
              toastError({ message: first.message });
            }
            return;
          }
          toastError({ message: "Failed to save skills" });
        },
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
          <Sparkles className="h-3.5 w-3.5" />
          Skills
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Manage skills
          </DialogTitle>
          <DialogDescription>
            Pick skills from the system catalog for{" "}
            <span className="font-medium text-foreground">{user.email}</span>{" "}
            and set a proficiency from 1 to 10.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {rows.length === 0 ? (
            <p className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
              {catalogLoading
                ? "Loading skills catalog..."
                : 'No skills yet. Click "Add skill" below and choose from the catalog.'}
            </p>
          ) : (
            rows.map((row, index) => (
              <div
                key={row.key}
                className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5"
              >
                <span className="w-6 text-center text-xs font-medium text-muted-foreground">
                  {index + 1}
                </span>
                <Select
                  value={row.skillName}
                  onValueChange={(value) =>
                    updateRow(row.key, { skillName: value })
                  }
                  disabled={catalogLoading}
                >
                  <SelectTrigger
                    className="flex-1"
                    aria-label={`Skill ${index + 1} name`}
                  >
                    <SelectValue placeholder="Select a skill from catalog" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {catalogLoading ? null : (
                      <>
                        {optionNames.map((name) => (
                          <SelectItem
                            key={name}
                            value={name}
                            disabled={isUsedByAnotherRow(row.key, name)}
                          >
                            {name}
                          </SelectItem>
                        ))}
                        {optionNames.length === 0 && (
                          <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                            No skills available in the catalog.
                          </p>
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    step={1}
                    value={row.proficiencyLevel}
                    onChange={(e) =>
                      updateRow(row.key, {
                        proficiencyLevel: Number(e.target.value),
                      })
                    }
                    className="w-20"
                    aria-label={`Skill ${index + 1} proficiency (1-10)`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(row.key)}
                    aria-label={`Remove skill ${row.skillName || index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-1.5 border-dashed"
          onClick={addRow}
          disabled={catalogLoading}
        >
          <Plus className="h-4 w-4" />
          Add skill
        </Button>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={!hasChanges || replaceSkills.isPending}
          >
            {replaceSkills.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Save skills
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
