# Resource SEO Checklist

Use this checklist whenever you add or update a resource in `server/resources/registry.ts` (with the downloadable file stored privately in `resources-private/`).

## 1. Required & Recommended Fields per Resource

- **`slug`**: Short lowercase kebab-case URL slug (`a-z`, `0-9`, `-`), 3–6 words aligned with the primary topic. Avoid changing slugs after publishing (if you must rename one, add a permanent `301` redirect in `vercel.json`).
- **`status`**:
  - `draft` — Hidden everywhere (hub, detail URL, HTML, JSON-LD, sitemap). Requests return HTTP `404`.
  - `coming-soon` — Shown on `/resources` as plain text (no link, not in sitemap). Detail URL returns HTTP `404`.
  - `published` — Live indexable detail page at `/resources/<slug>`, included in SSR HTML, JSON-LD, and `/sitemap.xml`.
- **`title`** & optional **`h1`**: Keep the card/page `title` natural and scannable for readers; use `h1` only if the detail page heading should differ slightly from the card title.
- **`seoTitle`** *(target <= 60 characters)*: Search title tag for `<title>`, `og:title`, and `twitter:title`. Defaults to `<title> | Free <formatType> from Joshua Omole` if omitted.
- **`seoDescription`** *(target 120–155 characters)*: Search meta description for `<meta name="description">`, `og:description`, and `twitter:description`. Defaults to `summary` if omitted.
- **`formatType`**: Clean short label (`PDF`, `Checklist`, `Template`, `Playbook`, `Workbook`, `Spreadsheet`) used automatically in default SEO titles when `format` has extra notes like `PDF (18 pages)`.
- **`audience`**: One crisp sentence answering *Who it's for* (rendered on the page and checked by `validate:resources`).
- **`includes`**: Concrete bullet list for the **What's inside** section.
- **`howToUse`** & **`description`**: At least 2 substantial paragraphs (`>= 60` words total recommended) explaining what problem it solves and how an operator should apply it. Keep `howToUse` for an optional short callout before the main paragraphs.
- **`publishedAt`** & **`updatedAt`**: ISO dates (`YYYY-MM-DD`). Used in `DigitalDocument` JSON-LD and sitemap `<lastmod>`.
- **`related`**: Up to 3 published slugs to link under **Related resources**. If fewer than 3 are listed, other published resources in the same `category` fill the remaining slots automatically.
- **`faq`** *(optional)*: 2–3 real buyer/reader questions and concise answers rendered visually on the page (intentionally not emitted as `FAQPage` JSON-LD).
- **`coverImage`** / **`coverImageAlt`** / **`ogImage`**: Landscape cover (`1200x900` recommended in `/public/images/...`) with descriptive alt text. If `ogImage` and `coverImage` are omitted, `/images/resources-og-default.png` (`1200x630`) is used automatically for social sharing.

## 2. Never Expose Private Files or Fields

- Put PDFs/workbooks strictly inside `resources-private/` — **never** in `public/`.
- Server-only fields (`fileName`, `loopsGroup`, `emailSubject`) are stripped by `toPublicResource()` and never appear in `/api/resources`, HTML, JSON-LD, or `sitemap.xml`.

## 3. Cross-Linking from `blog.joshuaomole.com`

When writing articles on `blog.joshuaomole.com`, link to individual resources with standard crawlable anchor tags and descriptive anchor text:

```html
<a href="https://joshuaomole.com/resources/your-resource-slug">
  Download the operational workflow checklist
</a>
```

- Link directly to `https://joshuaomole.com/resources/<slug>` (not `/resources?category=...`, and never via JS click-handlers or URL shorteners).
- Add 1–2 relevant contextual links per blog post where readers benefit from the template or checklist.

## 4. Category Pages (Future Scaling)

- Category filter chips on `/resources` intentionally filter in-place and keep `<link rel="canonical" href="https://joshuaomole.com/resources" />` so filter parameters (`?category=...`) never create duplicate indexed URLs.
- Once **8 or more published resources** span clear topic clusters, add dedicated static category landing routes (e.g. `/resources/category/<category-slug>`) with bespoke intro copy and list them in `sitemap.ts`.

## 5. Before & After Publishing Verification

1. Run local metadata audit & function checks:
   ```bash
   npm run validate:resources
   npm run lint
   npm run check:functions
   ```
2. Spot-check rendered crawler HTML (after starting local preview/prod build or deploying to Vercel):
   ```bash
   curl -i https://joshuaomole.com/resources
   curl -i https://joshuaomole.com/resources/your-resource-slug
   curl -i https://joshuaomole.com/resources/nonexistent-slug
   curl -i https://joshuaomole.com/sitemap.xml
   curl -i https://joshuaomole.com/robots.txt
   ```
   Verify HTTP `200` with body copy + JSON-LD on published pages, HTTP `404` + `noindex` on unknown/draft/coming-soon slugs, and zero mentions of `fileName` or `resources-private`.
3. Submit `https://joshuaomole.com/sitemap.xml` in **Google Search Console** (and confirm apex domain `https://joshuaomole.com` is primary in Vercel project domain settings so `www.joshuaomole.com` redirects permanently).
4. Use **Google Rich Results Test** and **URL Inspection -> Live Test** in Search Console on new `/resources/<slug>` pages.
