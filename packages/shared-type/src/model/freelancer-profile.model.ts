import { z } from "zod";

// Kỹ năng
const SkillSchema = z.object({
  name: z.string().min(1, "Tên kỹ năng không được để trống"),
  proficiency: z.number().int().min(1).max(10),
});

// Học vấn
const EducationSchema = z.object({
  school: z.string().min(1),
  degree: z.string().optional(),
  field: z.string().optional(),
  from: z.date().optional(),
  to: z.date().optional(),
});

// Chứng chỉ
const CertificationSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().optional(),
  year: z.number().optional(),
});

// Ngôn ngữ
const LanguageSchema = z.object({
  language: z.string().min(1),
  level: z.enum(["BASIC", "CONVERSATIONAL", "FLUENT", "NATIVE"]).optional(),
});

// Schema chính
export const FreelancerProfileFormSchema = z.object({
  // --- Thông tin chung từ bảng profiles ---
  displayName: z.string().min(2, "Tên hiển thị tối thiểu 2 ký tự").max(100),
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),

  // --- Thông tin freelancer ---
  title: z.string().min(5, "Tiêu đề công việc quá ngắn").max(255),
  skills: z.array(SkillSchema).min(1, "Cần ít nhất 1 kỹ năng"),
  education: z.array(EducationSchema).optional().default([]),
  certifications: z.array(CertificationSchema).optional().default([]),
  languages: z.array(LanguageSchema).optional().default([]),
});

export type FreelancerProfileForm = z.infer<typeof FreelancerProfileFormSchema>;
