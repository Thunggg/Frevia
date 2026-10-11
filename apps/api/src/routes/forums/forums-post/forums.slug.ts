export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function createCategorySlug(name: string, id: number): string {
  return `${slugify(name)}-${id}`;
}

export function createPostSlug(title: string): string {
  const base = slugify(title);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return `${base}-${suffix}`;
}
