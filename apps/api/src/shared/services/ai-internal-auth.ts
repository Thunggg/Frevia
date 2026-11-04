/**
 * Header xác thực service AI nội bộ (H26).
 *
 * Service AI (`section-aware-cv-job-matching/apps/ai`) bảo vệ `/internal/*`
 * bằng shared secret `INTERNAL_API_KEY` (header `X-Internal-Token`). Token phía
 * NestJS đọc từ env `FREVIA_AI_TOKEN`; bỏ trống -> không gửi header (dev).
 */
export function aiInternalAuthHeaders(): Record<string, string> {
  const token = process.env.FREVIA_AI_TOKEN?.trim();
  return token ? { 'X-Internal-Token': token } : {};
}
