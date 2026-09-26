import { z } from "zod";

export const ClientProfileFormSchema = z.object({
  // --- Thông tin chung ---
  displayName: z.string().min(2, "Tên hiển thị tối thiểu 2 ký tự").max(100),
  avatarUrl: z.url().optional().or(z.literal("")),

  // --- Thông tin công ty ---
  companyName: z.string().min(2, "Tên công ty không được để trống").max(255),
  companyDescription: z.string().max(2000).optional(),
  website: z.url("Website không hợp lệ").optional().or(z.literal("")),
});

export type ClientProfileForm = z.infer<typeof ClientProfileFormSchema>;
