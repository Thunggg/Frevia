/**
 * Extract numeric ID from a slug-id string.
 * Format: "slugified-name-123" → 123
 * The ID is always the last segment after the final hyphen that looks like a number.
 */
export function extractIdFromSlug(slugParam: string): number | null {
  const match = slugParam.match(/-(\d+)$/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Build a slug-id URL segment from a slug and ID.
 * Format: "slugified-name" + 123 → "slugified-name-123"
 */
export function buildSlugId(slug: string, id: number): string {
  return `${slug}-${id}`;
}
