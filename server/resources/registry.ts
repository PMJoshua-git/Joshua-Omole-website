import fs from 'fs';
import path from 'path';
import type { ResourceFaqItem, ResourcePublic, ResourceStatus } from '../../types/resources.js';
import {
  resolveResourceSeoDescription,
  resolveResourceSeoTitle,
} from '../../utils/resourceSeo.js';

export type { ResourceStatus, ResourceFaqItem, ResourcePublic };

export interface ResourceEntry extends ResourcePublic {
  // ── server-only fields (NEVER sent to the browser) ──
  fileName: string;        // exact file name inside resources-private/
  loopsGroup: string;      // the Loops userGroup value, used EXACTLY as written
  emailSubject?: string;   // optional override of the default subject
}

export const RESOURCES_DIR = path.resolve(process.cwd(), 'resources-private');

// Empty registry: Add your real resources here following the instructions in RESOURCES.md
export const resources: ResourceEntry[] = [];

export function getResourceBySlug(
  slug: string,
  entries: readonly ResourceEntry[] = resources
): ResourceEntry | undefined {
  return entries.find((r) => r.slug === slug);
}

/** Explicitly allowlists only public fields so server-only fields never leak to client or HTML. */
export function toPublicResource(entry: ResourceEntry): ResourcePublic {
  const pub: ResourcePublic = {
    slug: entry.slug,
    title: entry.title,
    summary: entry.summary,
    description: Array.isArray(entry.description) ? [...entry.description] : [],
    category: entry.category,
    format: entry.format,
    status: entry.status,
    order: entry.order,
  };

  if (entry.h1 !== undefined) pub.h1 = entry.h1;
  if (entry.seoTitle !== undefined) pub.seoTitle = entry.seoTitle;
  if (entry.seoDescription !== undefined) pub.seoDescription = entry.seoDescription;
  if (entry.includes !== undefined) pub.includes = [...entry.includes];
  if (entry.audience !== undefined) pub.audience = entry.audience;
  if (entry.howToUse !== undefined) pub.howToUse = entry.howToUse;
  if (entry.related !== undefined) pub.related = [...entry.related];
  if (entry.faq !== undefined) pub.faq = entry.faq.map((item) => ({ ...item }));
  if (entry.formatType !== undefined) pub.formatType = entry.formatType;
  if (entry.readingTime !== undefined) pub.readingTime = entry.readingTime;
  if (entry.publishedAt !== undefined) pub.publishedAt = entry.publishedAt;
  if (entry.updatedAt !== undefined) pub.updatedAt = entry.updatedAt;
  if (entry.coverImage !== undefined) pub.coverImage = entry.coverImage;
  if (entry.coverImageAlt !== undefined) pub.coverImageAlt = entry.coverImageAlt;
  if (entry.ogImage !== undefined) pub.ogImage = entry.ogImage;
  if (entry.featured !== undefined) pub.featured = entry.featured;

  return pub;
}

export function getPublicResources(entries: readonly ResourceEntry[] = resources): ResourcePublic[] {
  return entries
    .filter((r) => r.status === 'published' || r.status === 'coming-soon')
    .sort((a, b) => {
      if (Boolean(b.featured) !== Boolean(a.featured)) {
        return Boolean(b.featured) ? 1 : -1;
      }
      return a.order - b.order;
    })
    .map(toPublicResource);
}

export function getPublishedResources(
  entries: readonly ResourceEntry[] = resources
): ResourcePublic[] {
  return getPublicResources(entries).filter((r) => r.status === 'published');
}

export interface ResourceSeoAuditReport {
  warnings: string[];
  checkedCount: number;
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

export function auditResourceRegistrySeo(
  entries: readonly ResourceEntry[] = resources
): ResourceSeoAuditReport {
  const warnings: string[] = [];
  const seenTitles = new Map<string, string>();
  const seenDescriptions = new Map<string, string>();
  const publishedSlugs = new Set(
    entries.filter((e) => e.status === 'published').map((e) => e.slug)
  );

  for (const entry of entries) {
    if (entry.status === 'draft') continue;

    if (!entry.summary || entry.summary.trim() === '') {
      warnings.push(`[${entry.slug}] Missing summary.`);
    }

    const effectiveTitle = resolveResourceSeoTitle(entry);
    if (effectiveTitle.length > 60) {
      warnings.push(
        `[${entry.slug}] Effective SEO title is ${effectiveTitle.length} chars (target <= 60): "${effectiveTitle}".`
      );
    }

    const effectiveDesc = resolveResourceSeoDescription(entry);
    if (effectiveDesc.length > 155) {
      warnings.push(
        `[${entry.slug}] Effective SEO description is ${effectiveDesc.length} chars (target <= 155).`
      );
    }

    if (entry.status === 'published') {
      const titleKey = effectiveTitle.trim().toLowerCase();
      if (titleKey) {
        const existing = seenTitles.get(titleKey);
        if (existing) {
          warnings.push(
            `[${entry.slug}] Duplicate SEO title matches "${existing}": "${effectiveTitle}".`
          );
        } else {
          seenTitles.set(titleKey, entry.slug);
        }
      }

      const descKey = effectiveDesc.trim().toLowerCase();
      if (descKey) {
        const existing = seenDescriptions.get(descKey);
        if (existing) {
          warnings.push(
            `[${entry.slug}] Duplicate SEO description matches "${existing}".`
          );
        } else {
          seenDescriptions.set(descKey, entry.slug);
        }
      }

      const descText = (entry.description || []).join(' ').trim();
      const wordCount = descText ? descText.split(/\s+/).length : 0;
      if (wordCount < 60) {
        warnings.push(
          `[${entry.slug}] Description content is thin (${wordCount} words; aim for >= 60 words across 2+ paragraphs).`
        );
      }

      if (!entry.audience || entry.audience.trim() === '') {
        warnings.push(`[${entry.slug}] Missing "audience" (one-line "Who it's for").`);
      }

      if (entry.publishedAt && (!ISO_DATE_REGEX.test(entry.publishedAt) || Number.isNaN(Date.parse(entry.publishedAt)))) {
        warnings.push(`[${entry.slug}] Invalid ISO publishedAt "${entry.publishedAt}".`);
      }
      if (entry.updatedAt && (!ISO_DATE_REGEX.test(entry.updatedAt) || Number.isNaN(Date.parse(entry.updatedAt)))) {
        warnings.push(`[${entry.slug}] Invalid ISO updatedAt "${entry.updatedAt}".`);
      }

      if (Array.isArray(entry.related)) {
        for (const relSlug of entry.related) {
          if (relSlug === entry.slug) {
            warnings.push(`[${entry.slug}] "related" contains its own slug.`);
          } else if (!publishedSlugs.has(relSlug)) {
            warnings.push(`[${entry.slug}] "related" references non-published or unknown slug "${relSlug}".`);
          }
        }
      }

      if (Array.isArray(entry.faq)) {
        entry.faq.forEach((item, idx) => {
          if (!item?.question?.trim() || !item?.answer?.trim()) {
            warnings.push(`[${entry.slug}] FAQ #${idx + 1} is missing a question or answer.`);
          }
        });
      }
    }
  }

  return {
    warnings,
    checkedCount: entries.filter((e) => e.status !== 'draft').length,
  };
}

// Startup validation (runs once when the server boots; log, do not crash)
export function validateResourceRegistry(): void {
  const seenSlugs = new Set<string>();
  const kebabRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

  console.log('[ResourceRegistry] Validating resources registry...');

  for (const resource of resources) {
    if (!kebabRegex.test(resource.slug)) {
      console.warn(`[ResourceRegistry Warning] Slug "${resource.slug}" is not valid kebab-case.`);
    }
    if (seenSlugs.has(resource.slug)) {
      console.warn(`[ResourceRegistry Warning] Duplicate slug detected: "${resource.slug}". Slugs must be unique.`);
    }
    seenSlugs.add(resource.slug);

    if (!resource.loopsGroup || resource.loopsGroup.trim() === '') {
      console.warn(`[ResourceRegistry Warning] loopsGroup is empty for resource "${resource.slug}".`);
    }

    if (resource.status === 'published') {
      const filePath = path.resolve(RESOURCES_DIR, resource.fileName);
      if (!fs.existsSync(filePath)) {
        console.warn(`[ResourceRegistry Warning] Published resource "${resource.slug}" file missing at "${filePath}".`);
      } else {
        try {
          const stats = fs.statSync(filePath);
          if (stats.size > MAX_SIZE_BYTES) {
            console.warn(
              `[ResourceRegistry Warning] File "${resource.fileName}" is ${(stats.size / (1024 * 1024)).toFixed(1)}MB, exceeding the 25MB recommendation for email attachments.`
            );
          }
        } catch (e) {
          console.warn(`[ResourceRegistry Warning] Error checking file stats for "${resource.fileName}":`, e);
        }
      }
    }
  }

  const seoAudit = auditResourceRegistrySeo(resources);
  for (const w of seoAudit.warnings) {
    console.warn(`[ResourceSEO Warning] ${w}`);
  }

  console.log(
    `[ResourceRegistry] Registry loaded with ${resources.length} resources (${getPublicResources().length} public).`
  );
}
