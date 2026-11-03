export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function createContractSlug(title?: string): string {
  const base = title ? slugify(title).slice(0, 50) : 'contract';
  const cleanBase = base || 'contract';
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  return `contract-${cleanBase}-${suffix}`;
}
