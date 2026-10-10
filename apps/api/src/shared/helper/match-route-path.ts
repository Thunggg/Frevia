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
 * So khớp path thực tế với pattern permission (vd `/api/roles/:id`).
 */
export function matchRoutePath(pattern: string, actualPath: string): boolean {
  const patternParts = normalizeApiPath(pattern).split('/').filter(Boolean);
  const actualParts = normalizeApiPath(actualPath).split('/').filter(Boolean);

  if (patternParts.length !== actualParts.length) {
    return false;
  }

  return patternParts.every((part, index) => {
    if (part.startsWith(':')) return true;
    return part === actualParts[index];
  });
}
