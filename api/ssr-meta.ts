import fs from 'node:fs';
import path from 'node:path';
import { injectPageMetaIntoHtml } from '../server/seo/pageMeta';

let cachedTemplate: string | null = null;

async function loadIndexHtmlTemplate(req: any): Promise<string> {
  if (cachedTemplate) return cachedTemplate;

  const candidatePaths = [
    path.join(process.cwd(), 'dist', 'index.html'),
    path.join(process.cwd(), 'index.html'),
  ];

  for (const filePath of candidatePaths) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      if (content && content.includes('<div id="root">')) {
        cachedTemplate = content;
        return content;
      }
    } catch {
      // Try next candidate
    }
  }

  // Fallback: fetch built static index.html from own origin (excluded from rewrite because it has .html)
  const host = req.headers?.['x-forwarded-host'] || req.headers?.host;
  const proto = req.headers?.['x-forwarded-proto'] || 'https';
  if (host) {
    const response = await fetch(`${proto}://${host}/index.html`);
    if (response.ok) {
      const html = await response.text();
      if (html.includes('<div id="root">')) {
        cachedTemplate = html;
        return html;
      }
    }
  }

  throw new Error('Unable to locate built index.html template');
}

export default async function handler(req: any, res: any) {
  try {
    const rawQueryPath = Array.isArray(req.query?.path)
      ? req.query.path[0]
      : req.query?.path;
    const rawPath =
      typeof rawQueryPath === 'string' && rawQueryPath.length > 0
        ? rawQueryPath
        : req.url || '/';

    const template = await loadIndexHtmlTemplate(req);
    let html = template;
    try {
      html = injectPageMetaIntoHtml(template, rawPath);
    } catch (metaErr: any) {
      console.error('[SSR Meta] Meta tag injection failed; falling back to clean template:', metaErr?.message || metaErr);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(html);
  } catch (err: any) {
    console.error('[SSR Meta] Critical error rendering page, falling back to static index.html:', err?.message || err);
    try {
      const fallbackTemplate = await loadIndexHtmlTemplate(req);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(fallbackTemplate);
    } catch (fallbackErr: any) {
      console.error('[SSR Meta] Fallback index.html loading failed:', fallbackErr?.message || fallbackErr);
      return res.status(200).send('<!DOCTYPE html><html><head><title>Clarity Map</title></head><body><div id="root"></div></body></html>');
    }
  }
}
