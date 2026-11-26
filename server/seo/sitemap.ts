import {
  resources as registryResources,
  type ResourceEntry,
} from '../resources/registry.js';
import { normalizeCanonicalSiteUrl } from '../../utils/resourceSeo.js';

export interface SitemapStaticRoute {
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
}

export const SITEMAP_STATIC_ROUTES: SitemapStaticRoute[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/resources', changefreq: 'weekly', priority: '0.9' },
  { path: '/services', changefreq: 'monthly', priority: '0.9' },
  { path: '/clarity-map', changefreq: 'monthly', priority: '0.9' },
  { path: '/business-workflow-fixes', changefreq: 'monthly', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/training', changefreq: 'monthly', priority: '0.8' },
  { path: '/audit', changefreq: 'monthly', priority: '0.8' },
  { path: '/newsletter', changefreq: 'monthly', priority: '0.8' },
  { path: '/connect', changefreq: 'monthly', priority: '0.6' },
];

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatLastmod(rawDate?: string): string | null {
  if (!rawDate) return null;
  const trimmed = rawDate.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString().split('T')[0];
}

export function buildSitemapXml(
  entries: readonly ResourceEntry[] = registryResources,
  siteUrlInput?: string
): string {
  const siteUrl = normalizeCanonicalSiteUrl(siteUrlInput || process.env.SITE_URL);
  const urls: string[] = [];
  const seenLocs = new Set<string>();

  for (const route of SITEMAP_STATIC_ROUTES) {
    const loc = `${siteUrl}${route.path === '/' ? '/' : route.path}`;
    if (seenLocs.has(loc)) continue;
    seenLocs.add(loc);
    urls.push(
      [
        '  <url>',
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <changefreq>${route.changefreq}</changefreq>`,
        `    <priority>${route.priority}</priority>`,
        '  </url>',
      ].join('\n')
    );
  }

  const publishedEntries = entries
    .filter((entry) => entry.status === 'published')
    .sort((a, b) => a.order - b.order);

  for (const resource of publishedEntries) {
    const loc = `${siteUrl}/resources/${resource.slug}`;
    if (seenLocs.has(loc)) continue;
    seenLocs.add(loc);
    const lastmod = formatLastmod(resource.updatedAt || resource.publishedAt);
    urls.push(
      [
        '  <url>',
        `    <loc>${escapeXml(loc)}</loc>`,
        lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : null,
        '    <changefreq>monthly</changefreq>',
        '    <priority>0.8</priority>',
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n')
    );
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}
