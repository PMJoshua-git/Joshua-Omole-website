import type { ResourcePublic } from '../types/resources.js';

export const CANONICAL_SITE_URL = 'https://joshuaomole.com';
export const RESOURCES_FALLBACK_OG_IMAGE = '/images/resources-og-default.png';

export function normalizeCanonicalSiteUrl(raw?: string): string {
  const trimmed = (raw || CANONICAL_SITE_URL).trim();
  let candidate = trimmed || CANONICAL_SITE_URL;
  try {
    const parsed = new URL(candidate);
    candidate = `${parsed.protocol}//${parsed.host}`;
  } catch {
    candidate = CANONICAL_SITE_URL;
  }
  return candidate.endsWith('/') ? candidate.slice(0, -1) : candidate;
}

export function normalizeCanonicalPath(rawPath: string): string {
  const pathOnly = (rawPath || '/').split('?')[0].split('#')[0].trim();
  let clean = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  return clean.toLowerCase();
}

export function getShortFormatType(format: string, formatType?: string): string {
  if (formatType && formatType.trim()) {
    return formatType.trim();
  }
  const withoutParens = (format || '').replace(/\([^)]*\)/g, '').trim();
  const knownTypes = [
    'Checklist',
    'Template',
    'Playbook',
    'Workbook',
    'Spreadsheet',
    'Framework',
    'Guide',
    'PDF',
    'DOCX',
    'PPTX',
    'XLSX',
  ];
  for (const type of knownTypes) {
    if (new RegExp(`\\b${type}\\b`, 'i').test(withoutParens)) {
      return type;
    }
  }
  const firstToken = withoutParens.split(/\s+/)[0];
  return firstToken || 'PDF';
}

export function resolveResourceH1(resource: Pick<ResourcePublic, 'title' | 'h1'>): string {
  return resource.h1?.trim() || resource.title;
}

export function resolveResourceSeoTitle(
  resource: Pick<ResourcePublic, 'title' | 'seoTitle' | 'format' | 'formatType'>
): string {
  if (resource.seoTitle && resource.seoTitle.trim()) {
    return resource.seoTitle.trim();
  }
  const shortFormat = getShortFormatType(resource.format, resource.formatType);
  return `${resource.title} | Free ${shortFormat} from Joshua Omole`;
}

export function resolveResourceSeoDescription(
  resource: Pick<ResourcePublic, 'summary' | 'seoDescription'>
): string {
  return (resource.seoDescription && resource.seoDescription.trim()) || resource.summary || '';
}

export function resolveResourceOgImagePath(
  resource: Pick<ResourcePublic, 'ogImage' | 'coverImage'>
): string {
  const candidate = resource.ogImage?.trim() || resource.coverImage?.trim();
  return candidate || RESOURCES_FALLBACK_OG_IMAGE;
}

export function resolveResourceOgImageUrl(
  resource: Pick<ResourcePublic, 'ogImage' | 'coverImage'>,
  siteUrl: string = CANONICAL_SITE_URL
): string {
  const base = normalizeCanonicalSiteUrl(siteUrl);
  const imgPath = resolveResourceOgImagePath(resource);
  if (/^https?:\/\//i.test(imgPath)) {
    return imgPath;
  }
  return `${base}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`;
}

export function resolveRelatedResources(
  resource: ResourcePublic,
  allResources: ResourcePublic[],
  max: number = 3
): ResourcePublic[] {
  const published = allResources
    .filter((r) => r.status === 'published' && r.slug !== resource.slug)
    .sort((a, b) => a.order - b.order);

  const bySlug = new Map(published.map((r) => [r.slug, r]));
  const selected: ResourcePublic[] = [];
  const seen = new Set<string>();

  if (Array.isArray(resource.related)) {
    for (const relSlug of resource.related) {
      const match = bySlug.get(relSlug);
      if (match && !seen.has(match.slug)) {
        selected.push(match);
        seen.add(match.slug);
        if (selected.length >= max) return selected;
      }
    }
  }

  for (const candidate of published) {
    if (seen.has(candidate.slug)) continue;
    if (candidate.category && resource.category && candidate.category === resource.category) {
      selected.push(candidate);
      seen.add(candidate.slug);
      if (selected.length >= max) return selected;
    }
  }

  return selected;
}

export function safeJsonLdStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
