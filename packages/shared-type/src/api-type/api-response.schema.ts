import { z } from "zod";

// ===== VALIDATION ISSUE =====
export const ValidationIssueSchema = z.object({
  code: z.string(),
  path: z.string(),
  message: z.string(),
});
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;

// ===== RESPONSE WRAPPER =====
export type ApiSuccess<T> = {
  success: true;
  data: T;
  timestamp: string;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationIssue[];
  };
  timestamp: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiPaginated<T> = {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  timestamp: string;
};
