import fs from 'node:fs';
import path from 'node:path';

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
  const host = req.headers?.['x-forwarded-host'] || req.headers?.host || process.env.VERCEL_URL;
  const proto = req.headers?.['x-forwarded-proto'] || 'https';
  if (host) {
    const fetchHeaders: Record<string, string> = {};
    if (req.headers?.cookie) {
      fetchHeaders.cookie = String(req.headers.cookie);
    }
    const response = await fetch(`${proto}://${host}/index.html`, {
      headers: fetchHeaders,
    });
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
  let template: string | null = null;

  try {
    const rawQueryPath = Array.isArray(req.query?.path)
      ? req.query.path[0]
      : req.query?.path;
    const rawPath =
      typeof rawQueryPath === 'string' && rawQueryPath.length > 0
        ? rawQueryPath
        : req.url || '/';

    template = await loadIndexHtmlTemplate(req);
    let html = template;

    try {
      const { injectPageMetaIntoHtml } = await import('../server/seo/pageMeta.js');
      html = injectPageMetaIntoHtml(template, rawPath);
    } catch (metaErr: any) {
      console.error(
        '[SSR Meta] Meta tag injection failed; serving plain index.html:',
        metaErr?.message || metaErr
      );
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(html);
  } catch (err: any) {
    console.error(
      '[SSR Meta] Critical error rendering page, falling back to plain index.html:',
      err?.message || err
    );
    try {
      const fallbackHtml = template || (await loadIndexHtmlTemplate(req));
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(fallbackHtml);
    } catch (fallbackErr: any) {
      console.error(
        '[SSR Meta] Fallback index.html loading failed:',
        fallbackErr?.message || fallbackErr
      );
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res
        .status(200)
        .send(
          '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Joshua Omole | Business Operations & AI Systems Strategist</title></head><body><div id="root"></div></body></html>'
        );
    }
  }
}
