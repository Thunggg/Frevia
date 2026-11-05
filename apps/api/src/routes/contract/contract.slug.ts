export function slugify(value: string): string {
  if (!value) return '';

  return value
    .toLowerCase()
    .trim()
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createContractSlug(title?: string): string {
  const slugifiedTitle = title ? slugify(title) : '';

  const cleanBase = slugifiedTitle
    ? slugifiedTitle.slice(0, 50).replace(/-[^-]*$/, '') || slugifiedTitle.slice(0, 50)
    : '';

  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  return cleanBase ? `contract-${cleanBase}-${suffix}` : `contract-${suffix}`;
}