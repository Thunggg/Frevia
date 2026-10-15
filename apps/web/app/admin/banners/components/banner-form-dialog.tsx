"use client";

import {
  adminApiRequest,
} from "@/apiRequests/admin";
import { ApiFail } from "@/lib/http";
import { Button } from "@repo/ui/components/shadcn/button";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
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
import { Label } from "@repo/ui/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type {
  BannerAdminItemType,
  BannerCreateBodyType,
  BannerPosition,
  BannerUpdateBodyType,
} from "@shared/types";
import { ImageIcon, Loader2, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BANNER_POSITIONS } from "../constants";

interface BannerFormDialogProps {
  banner?: BannerAdminItemType;
  triggerClassName?: string;
}

function toDateInputValue(value: Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function BannerFormDialog({
  banner,
  triggerClassName,
}: BannerFormDialogProps) {
  const router = useRouter();
  const isEdit = !!banner;
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [position, setPosition] = useState<BannerPosition>("GLOBAL_HEADER");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const setFilePreview = (file: File) => {
    revokeObjectUrl();
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreviewUrl(url);
  };

  useEffect(() => {
    if (open && banner) {
      setTitle(banner.title);
      setPosition(banner.position);
      setImageUrl(banner.imageUrl ?? "");
      setSelectedFile(null);
      revokeObjectUrl();
      setPreviewUrl(banner.imageUrl ?? "");
      setLinkUrl(banner.linkUrl ?? "");
      setStartDate(toDateInputValue(banner.startDate));
      setEndDate(toDateInputValue(banner.endDate));
      setIsActive(banner.isActive);
    }
  }, [open, banner]);

  useEffect(() => {
    return () => revokeObjectUrl();
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      revokeObjectUrl();
      setSelectedFile(null);
      setPreviewUrl("");
      if (!isEdit) {
        setTitle("");
        setPosition("GLOBAL_HEADER");
        setImageUrl("");
        setLinkUrl("");
        setStartDate("");
        setEndDate("");
        setIsActive(true);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    setOpen(nextOpen);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setFilePreview(file);
  };

  const handleRemoveImage = () => {
    revokeObjectUrl();
    setPreviewUrl("");
    setSelectedFile(null);
    setImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toastUploadError = (err: unknown) => {
    if (err instanceof ApiFail) {
      const detailMessage = err.response?.error?.details?.[0]?.message;
      toastError({ message: detailMessage ?? "Failed to upload image." });
    } else {
      toastError({ message: "Failed to upload image." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      let finalImageUrl = imageUrl.trim() || null;
      if (selectedFile) {
        setUploading(true);
        try {
          const result = await adminApiRequest.uploadBannerImage(selectedFile);
          finalImageUrl = result.imageUrl;
        } catch (err) {
          toastUploadError(err);
          return;
        } finally {
          setUploading(false);
        }
      }

      const common = {
        title: title.trim(),
        imageUrl: finalImageUrl,
        linkUrl: linkUrl.trim() || null,
        position,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      };

      if (isEdit && banner) {
        const body: BannerUpdateBodyType = {
          ...common,
          isActive,
        };
        await adminApiRequest.updateBanner(banner.id, body);
        toastSuccess({ message: "Banner updated successfully!" });
      } else {
        const body: BannerCreateBodyType = {
          ...common,
          isActive,
        };
        await adminApiRequest.createBanner(body);
        toastSuccess({ message: "Banner created successfully!" });
      }
      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiFail) {
        const detailMessage = err.response?.error?.details?.[0]?.message;
        toastError({
          message: detailMessage ?? (isEdit ? "Failed to update banner." : "Failed to create banner."),
        });
      } else {
        toastError({ message: isEdit ? "Failed to update banner." : "Failed to create banner." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button
            variant="ghost"
            size="icon"
            className={
              triggerClassName ??
              "h-8 w-8 text-muted-foreground hover:bg-[#4fae2e]/10 hover:text-[#4fae2e] transition-colors"
            }
            title="Edit banner"
            aria-label={`Edit banner ${banner?.title}`}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="gap-2 bg-[#4fae2e] text-white hover:bg-[#3f9225]">
            <Plus className="h-4 w-4" />
            Create Banner
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-x-hidden overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Banner" : "Create New Banner"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update banner details. Each position allows only one active banner."
                : "Add a new advertisement banner. Each position allows only one active banner."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor={`${isEdit ? "edit" : "create"}-title`} className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`${isEdit ? "edit" : "create"}-title`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer campaign 2026"
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="banner-position" className="text-sm font-medium">
                Position <span className="text-destructive">*</span>
              </Label>
              <Select
                value={position}
                onValueChange={(value) => setPosition(value as BannerPosition)}
                disabled={loading}
              >
                <SelectTrigger id="banner-position" className="w-full">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {BANNER_POSITIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="banner-image" className="text-sm font-medium">
                Banner Image <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff"
                  disabled={uploading || loading}
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-[#4fae2e]/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#4fae2e] hover:file:bg-[#4fae2e]/20"
                />
                {uploading && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Uploading image...
                  </p>
                )}
                {previewUrl && !uploading && (
                  <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- banner preview */}
                    <img
                      src={previewUrl}
                      alt="Banner preview"
                      className="h-14 w-24 rounded border object-cover bg-muted"
                    />
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate text-xs text-muted-foreground">
                        {selectedFile ? selectedFile.name : previewUrl}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={loading}
                        className="w-fit text-xs font-medium text-destructive hover:underline"
                      >
                        Remove image
                      </button>
                    </div>
                  </div>
                )}
                {!previewUrl && !uploading && (
                  <div className="flex items-center gap-2 rounded-md border border-dashed p-2 text-xs text-muted-foreground">
                    <ImageIcon className="h-3.5 w-3.5" />
                    No image yet. Select a file above to preview.
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="banner-link" className="text-sm font-medium">
                Link URL
              </Label>
              <Input
                id="banner-link"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/promo"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="banner-start" className="text-sm font-medium">
                  Start Date
                </Label>
                <Input
                  id="banner-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="banner-end" className="text-sm font-medium">
                  End Date
                </Label>
                <Input
                  id="banner-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="banner-active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
                disabled={loading}
              />
              <Label
                htmlFor="banner-active"
                className="text-sm font-medium cursor-pointer"
              >
                Active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                uploading ||
                !title.trim() ||
                (!imageUrl.trim() && !selectedFile)
              }
              className="bg-[#4fae2e] text-white hover:bg-[#3f9225]"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Banner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}