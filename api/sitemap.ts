import { buildSitemapXml } from '../server/seo/sitemap.js';

export default async function handler(_req: any, res: any) {
  try {
    const xml = buildSitemapXml();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (err: any) {
    console.error('[Sitemap] Failed to generate sitemap.xml:', err?.message || err);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res
      .status(500)
      .send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}
