"use client";

import { useActionPermission } from "@/hooks/use-action-permission";
import { BannerFormDialog } from "./banner-form-dialog";

export function CreateBannerDialog() {
  const { can } = useActionPermission();

  if (!can("POST", "/api/admin/banners")) {
    return null;
  }

  return <BannerFormDialog />;
}