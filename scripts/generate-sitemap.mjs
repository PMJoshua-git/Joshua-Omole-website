import fs from 'node:fs';
import path from 'node:path';
import { buildSitemapXml } from '../server/seo/sitemap.js';
import { resources } from '../server/resources/registry.js';

function main() {
  const xml = buildSitemapXml(resources);
  const outPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, xml, 'utf8');
  const urlCount = (xml.match(/<url>/g) || []).length;
  console.log(`[generate:sitemap] Wrote ${outPath} with ${urlCount} canonical URL(s).`);
}

main();
