/**
 * Chuẩn hóa path để so khớp (bỏ query, đảm bảo có prefix /api).
 */
export function normalizeApiPath(path: string): string {
  const withoutQuery = path.split('?')[0] || '/';
  const withLeadingSlash = withoutQuery.startsWith('/')
    ? withoutQuery
    : `/${withoutQuery}`;

  if (withLeadingSlash === '/api' || withLeadingSlash.startsWith('/api/')) {
    return withLeadingSlash;
  }

  return `/api${withLeadingSlash === '/' ? '' : withLeadingSlash}`;
}

/**
 * Danh sách các static keywords thường dùng làm sub-route độc lập,
 * không được xem là dynamic parameter identifier (:id, :jobId, :userId, v.v.).
 */
const STATIC_RESERVED_SEGMENTS = new Set([
  'my',
  'me',
  'stats',
  'trash',
  'skills',
  'bookmarks',
  'upload-image',
  'reindex',
  'outbox',
  'skills-catalog',
  'discover',
  'suggestions',
  'portfolios',
  'cv',
  'analysis',
  'documents',
  'status',
  'ai-check',
  'liveness-pose',
  'matching-jobs',
  'slug',
]);

/**
 * So khớp path thực tế với pattern permission (vd `/api/roles/:id`).
 */
export function matchRoutePath(pattern: string, actualPath: string): boolean {
  const patternParts = normalizeApiPath(pattern).split('/').filter(Boolean);
  const actualParts = normalizeApiPath(actualPath).split('/').filter(Boolean);

  if (patternParts.length !== actualParts.length) {
    return false;
  }

  return patternParts.every((part, index) => {
    if (part.startsWith(':')) {
      const actual = actualParts[index];
      // Nếu pattern là :id/:jobId/:proposalId nhưng actualPath là static keyword riêng (như 'my', 'me'),
      // thì không được match.
      if (actual && STATIC_RESERVED_SEGMENTS.has(actual.toLowerCase())) {
        return false;
      }
      return true;
    }
    return part === actualParts[index];
  });
}
