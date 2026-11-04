import fs from 'fs';
import path from 'path';

export type ResourceStatus = 'published' | 'coming-soon' | 'draft';

export interface ResourceEntry {
  // ── public fields (sent to the browser) ──
  slug: string;            // kebab-case, unique, permanent: it is the shareable URL
  title: string;
  summary: string;         // max ~140 chars, used on cards and social previews
  description: string[];   // long description, one string per paragraph
  includes?: string[];     // "What's inside": 3 to 5 short bullets
  category: string;        // e.g. 'Operations', 'Systems Thinking', 'Frameworks'
  format: string;          // 'PDF' | 'DOCX' | 'PPTX' | 'XLSX' | 'Checklist' | ...
  readingTime?: string;    // e.g. '8 min read'. Optional.
  coverImage?: string;     // e.g. '/images/resources/sop-template.jpg'. Optional.
  status: ResourceStatus;
  featured?: boolean;
  order: number;           // lower shows first

  // ── server-only fields (NEVER sent to the browser) ──
  fileName: string;        // exact file name inside resources-private/
  loopsGroup: string;      // the Loops userGroup value, used EXACTLY as written
  emailSubject?: string;   // optional override of the default subject
}

export type ResourcePublic = Omit<ResourceEntry, 'fileName' | 'loopsGroup' | 'emailSubject'>;

export const RESOURCES_DIR = path.resolve(process.cwd(), 'resources-private');

// Empty registry: Add your real resources here following the instructions in RESOURCES.md
export const resources: ResourceEntry[] = [];

export function getResourceBySlug(slug: string): ResourceEntry | undefined {
  return resources.find(r => r.slug === slug);
}

export function getPublicResources(): ResourcePublic[] {
  return resources
    .filter(r => r.status === 'published' || r.status === 'coming-soon')
    .sort((a, b) => {
      if (Boolean(b.featured) !== Boolean(a.featured)) {
        return Boolean(b.featured) ? 1 : -1;
      }
      return a.order - b.order;
    })
    .map(({ fileName, loopsGroup, emailSubject, ...publicFields }) => publicFields);
}

// Startup validation (runs once when the server boots; log, do not crash)
export function validateResourceRegistry(): void {
  const seenSlugs = new Set<string>();
  const kebabRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

  console.log('[ResourceRegistry] Validating resources registry...');

  for (const resource of resources) {
    // 1. Slug format and uniqueness
    if (!kebabRegex.test(resource.slug)) {
      console.warn(`[ResourceRegistry Warning] Slug "${resource.slug}" is not valid kebab-case.`);
    }
    if (seenSlugs.has(resource.slug)) {
      console.warn(`[ResourceRegistry Warning] Duplicate slug detected: "${resource.slug}". Slugs must be unique.`);
    }
    seenSlugs.add(resource.slug);

    // 2. loopsGroup check
    if (!resource.loopsGroup || resource.loopsGroup.trim() === '') {
      console.warn(`[ResourceRegistry Warning] loopsGroup is empty for resource "${resource.slug}".`);
    }

    // 3. File existence and size check for 'published' resources
    if (resource.status === 'published') {
      const filePath = path.resolve(RESOURCES_DIR, resource.fileName);
      if (!fs.existsSync(filePath)) {
        console.warn(`[ResourceRegistry Warning] Published resource "${resource.slug}" file missing at "${filePath}".`);
      } else {
        try {
          const stats = fs.statSync(filePath);
          if (stats.size > MAX_SIZE_BYTES) {
            console.warn(`[ResourceRegistry Warning] File "${resource.fileName}" is ${(stats.size / (1024 * 1024)).toFixed(1)}MB, exceeding the 25MB recommendation for email attachments.`);
          }
        } catch (e) {
          console.warn(`[ResourceRegistry Warning] Error checking file stats for "${resource.fileName}":`, e);
        }
      }
    }
  }

  console.log(`[ResourceRegistry] Registry loaded with ${resources.length} resources (${getPublicResources().length} public).`);
}
