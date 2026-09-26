import { z } from "zod";

// ===== VALIDATION ISSUE (khớp thật với ZodIssue) =====
export const ValidationIssueSchema = z.object({
  code: z.string(), // "invalid_type", "unrecognized_keys", ...
  path: z.string(),
  message: z.string(),
});
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;

// ===== RESPONSE WRAPPER (chỉ cần type, không cần Zod validate) =====
// Lý do: đây là data do chính backend tạo ra, không phải input ngoài cần validate runtime.
export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: { timestamp: string };
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationIssue[];
  };
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
};

// ===== TYPE GUARD tiện dùng ở FE =====
export function isApiSuccess<T>(res: ApiResponse<T>): res is ApiSuccess<T> {
  return res.success === true;
}
