import {
  getPublicResources,
  getPublishedResources,
  getResourceBySlug,
  resources as registryResources,
  toPublicResource,
  type ResourceEntry,
  type ResourcePublic,
} from '../resources/registry.js';
import {
  RESOURCES_FALLBACK_OG_IMAGE,
  normalizeCanonicalPath,
  normalizeCanonicalSiteUrl,
  resolveRelatedResources,
  resolveResourceH1,
  resolveResourceOgImageUrl,
  resolveResourceSeoDescription,
  resolveResourceSeoTitle,
  safeJsonLdStringify,
} from '../../utils/resourceSeo.js';

export interface PageMeta {
  title: string;
  description: string;
  url: string;
  canonicalUrl: string | null;
  image: string;
  type: 'website' | 'article';
  robots: string;
  statusCode: number;
  isNotFound: boolean;
  isResourceRoute: boolean;
  isResourceIndex: boolean;
  resource?: ResourceEntry;
}

export interface RenderSeoHtmlResult {
  html: string;
  statusCode: number;
  isNotFound: boolean;
  isResourceRoute: boolean;
  meta: PageMeta;
}

export const PERSON_SAME_AS = [
  'https://www.linkedin.com/in/joshuaolaaduraomole',
  'https://facebook.com/joshua.omole',
  'https://x.com/JO_JoshuaOmole',
  'https://medium.com/@joshuaomole',
];

export const normalizePathname = normalizeCanonicalPath;

export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const ROUTE_META_MAP: Record<
  string,
  { title: string; description: string; canonicalPath?: string; imagePath?: string }
> = {
  '/': {
    title: 'Joshua Omole | Business Operations and AI Systems Strategist',
    description:
      'Joshua Omole helps growing businesses build operations that are easier to run and easier to scale using systems thinking, automation, and AI.',
    canonicalPath: '/',
  },
  '/about': {
    title: 'About | Joshua Omole | Business Operations & AI Systems Strategist',
    description:
      'I build the operational architecture that makes a business run without the founder holding everything together manually.',
    canonicalPath: '/about',
  },
  '/services': {
    title: 'Services | Joshua Omole | Business Operations & AI Systems Strategist',
    description:
      'Every service starts by understanding how your business actually runs, then building the clearest, most direct path to making it run better.',
    canonicalPath: '/services',
  },
  '/training': {
    title: 'Live Training Sessions | Joshua Omole',
    description:
      'Live sessions combining technical knowledge, operational thinking, and systems design. Built for SME founders and operators.',
    canonicalPath: '/training',
  },
  '/audit': {
    title: 'Free Systems Clarity Audit | Joshua Omole',
    description:
      'Find out what your operation is actually costing you right now. A focused 30-minute session to pinpoint bottlenecks and walk away with 3 actionable findings.',
    canonicalPath: '/audit',
  },
  '/contact': {
    title: 'Free Systems Clarity Audit | Joshua Omole',
    description:
      'Find out what your operation is actually costing you right now. A focused 30-minute session to pinpoint bottlenecks and walk away with 3 actionable findings.',
    canonicalPath: '/audit',
  },
  '/connect': {
    title: 'Connect & Resources | Joshua Omole',
    description:
      'Book consultation calls, access operational training, register for live workshops, and sign up for the weekly newsletter with Joshua Omole.',
    canonicalPath: '/connect',
  },
  '/newsletter': {
    title: 'Newsletter | Joshua Omole',
    description:
      'Join professionals, founders, and decision-makers receiving practical insights on AI, technology, systems thinking, project execution, and business transformation.',
    canonicalPath: '/newsletter',
  },
  '/resources': {
    title: 'Resources — Free Operational Resources | Joshua Omole',
    description:
      'Free guides, frameworks, and resources for SME founders and operators. Practical operational tools you can apply today.',
    canonicalPath: '/resources',
  },
  '/knowledge-hub': {
    title: 'Resources — Free Operational Resources | Joshua Omole',
    description:
      'Free guides, frameworks, and resources for SME founders and operators. Practical operational tools you can apply today.',
    canonicalPath: '/resources',
  },
  '/knowledge': {
    title: 'Resources — Free Operational Resources | Joshua Omole',
    description:
      'Free guides, frameworks, and resources for SME founders and operators. Practical operational tools you can apply today.',
    canonicalPath: '/resources',
  },
  '/business-workflow-fixes': {
    title: 'Business Workflow Fixes | Joshua Omole',
    description:
      'Fix the small operational leaks that cost your business leads, sales, and time with custom, lightweight automations.',
    canonicalPath: '/business-workflow-fixes',
  },
  '/clarity-map': {
    title: 'Clarity Map | Interactive Business Workflow Diagnostic | Joshua Omole',
    description:
      'See how your business workflows currently run, how to fix them without new software using BRIDGE, and where automation truly belongs.',
    canonicalPath: '/clarity-map',
  },
};

export function resolvePageMeta(
  rawPath: string,
  entries: readonly ResourceEntry[] = registryResources
): PageMeta {
  const siteUrl = normalizeCanonicalSiteUrl(process.env.SITE_URL);
  const cleanPath = normalizeCanonicalPath(rawPath);
  const defaultImage = `${siteUrl}/images/joshua-portrait.png`;

  if (cleanPath.startsWith('/resources/')) {
    const slug = cleanPath.slice('/resources/'.length);
    const hasInvalidSegments = !slug || slug.includes('/');
    const resource = hasInvalidSegments ? undefined : getResourceBySlug(slug, entries);

    if (resource && resource.status === 'published') {
      const canonicalUrl = `${siteUrl}/resources/${resource.slug}`;
      return {
        title: resolveResourceSeoTitle(resource),
        description: resolveResourceSeoDescription(resource),
        url: canonicalUrl,
        canonicalUrl,
        image: resolveResourceOgImageUrl(resource, siteUrl),
        type: 'article',
        robots: 'index, follow',
        statusCode: 200,
        isNotFound: false,
        isResourceRoute: true,
        isResourceIndex: false,
        resource,
      };
    }

    // Real 404 for unknown, draft, coming-soon, or nested /resources/* paths (no homepage canonical fallback)
    return {
      title: 'Resource Not Found | Joshua Omole',
      description:
        'This resource could not be found or is no longer available. Browse free operational resources from Joshua Omole.',
      url: `${siteUrl}${cleanPath}`,
      canonicalUrl: null,
      image: `${siteUrl}${RESOURCES_FALLBACK_OG_IMAGE}`,
      type: 'website',
      robots: 'noindex, nofollow',
      statusCode: 404,
      isNotFound: true,
      isResourceRoute: true,
      isResourceIndex: false,
    };
  }

  const isResourceIndex =
    cleanPath === '/resources' || cleanPath === '/knowledge-hub' || cleanPath === '/knowledge';
  const matched = ROUTE_META_MAP[cleanPath];

  if (!matched) {
    return {
      title: '404 — Page Not Found | Joshua Omole',
      description:
        'The page you are looking for could not be found. Return home or view services on JoshuaOmole.com.',
      url: `${siteUrl}${cleanPath}`,
      canonicalUrl: null,
      image: defaultImage,
      type: 'website',
      robots: 'noindex, nofollow',
      statusCode: 404,
      isNotFound: true,
      isResourceRoute: false,
      isResourceIndex: false,
    };
  }

  const canonicalPath = matched.canonicalPath ?? cleanPath;
  const canonicalUrl = `${siteUrl}${canonicalPath === '/' ? '/' : canonicalPath}`;

  return {
    title: matched.title,
    description: matched.description,
    url: canonicalUrl,
    canonicalUrl,
    image: matched.imagePath ? `${siteUrl}${matched.imagePath}` : defaultImage,
    type: 'website',
    robots: 'index, follow',
    statusCode: 200,
    isNotFound: false,
    isResourceRoute: isResourceIndex,
    isResourceIndex,
  };
}

export function buildStructuredDataGraph(
  meta: PageMeta,
  siteUrl: string = normalizeCanonicalSiteUrl(process.env.SITE_URL),
  entries: readonly ResourceEntry[] = registryResources
): Record<string, unknown> | null {
  if (meta.isNotFound) {
    return null;
  }

  const personId = `${siteUrl}/#person`;
  const websiteId = `${siteUrl}/#website`;

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Person',
      '@id': personId,
      name: 'Joshua Omole',
      url: `${siteUrl}/`,
      jobTitle: 'Business Operations & AI Systems Strategist',
      sameAs: PERSON_SAME_AS,
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: `${siteUrl}/`,
      name: 'Joshua Omole',
      publisher: { '@id': personId },
    },
  ];

  if (meta.isResourceIndex) {
    const published = getPublishedResources(entries);
    const breadcrumbId = `${siteUrl}/resources#breadcrumb`;

    graph.push({
      '@type': 'BreadcrumbList',
      '@id': breadcrumbId,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${siteUrl}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Resources',
          item: `${siteUrl}/resources`,
        },
      ],
    });

    graph.push({
      '@type': 'CollectionPage',
      '@id': `${siteUrl}/resources#webpage`,
      url: `${siteUrl}/resources`,
      name: meta.title,
      description: meta.description,
      isPartOf: { '@id': websiteId },
      author: { '@id': personId },
      breadcrumb: { '@id': breadcrumbId },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: published.length,
        itemListElement: published.map((item, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: item.title,
          url: `${siteUrl}/resources/${item.slug}`,
        })),
      },
    });
  } else if (meta.resource && meta.resource.status === 'published') {
    const pub = toPublicResource(meta.resource);
    const resourceUrl = `${siteUrl}/resources/${pub.slug}`;
    const breadcrumbId = `${resourceUrl}#breadcrumb`;
    const h1Text = resolveResourceH1(pub);

    graph.push({
      '@type': 'BreadcrumbList',
      '@id': breadcrumbId,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${siteUrl}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Resources',
          item: `${siteUrl}/resources`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: h1Text,
          item: resourceUrl,
        },
      ],
    });

    const documentNode: Record<string, unknown> = {
      '@type': 'DigitalDocument',
      '@id': `${resourceUrl}#document`,
      name: h1Text,
      description: resolveResourceSeoDescription(pub),
      url: resourceUrl,
      image: resolveResourceOgImageUrl(pub, siteUrl),
      author: { '@id': personId },
      inLanguage: 'en',
      isAccessibleForFree: true,
    };

    if (pub.format) {
      documentNode.encodingFormat = /pdf/i.test(pub.format) ? 'application/pdf' : pub.format;
    }
    if (pub.publishedAt) {
      documentNode.datePublished = pub.publishedAt;
    }
    if (pub.updatedAt || pub.publishedAt) {
      documentNode.dateModified = pub.updatedAt || pub.publishedAt;
    }

    graph.push({
      '@type': 'WebPage',
      '@id': `${resourceUrl}#webpage`,
      url: resourceUrl,
      name: meta.title,
      description: meta.description,
      isPartOf: { '@id': websiteId },
      breadcrumb: { '@id': breadcrumbId },
      mainEntity: documentNode,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

function renderSsrHeaderHtml(): string {
  return `<header><nav aria-label="Primary navigation"><a href="/">Joshua Omole</a> <a href="/about">About</a> <a href="/services">Services</a> <a href="/resources">Resources</a> <a href="/audit">Book Audit</a></nav></header>`;
}

function renderSsrFooterHtml(): string {
  return `<footer><nav aria-label="Footer navigation"><a href="/">Home</a> <a href="/about">About</a> <a href="/services">Services</a> <a href="/training">Training</a> <a href="/resources">Resources</a> <a href="/audit">Audit</a> <a href="/newsletter">Newsletter</a></nav></footer>`;
}

export function renderSsrBodyHtml(
  meta: PageMeta,
  entries: readonly ResourceEntry[] = registryResources
): { bodyHtml: string; preloadPublicResources: ResourcePublic[] | null } {
  if (meta.isNotFound) {
    if (meta.isResourceRoute) {
      const bodyHtml = [
        renderSsrHeaderHtml(),
        '<main>',
        '<h1>Resource not found</h1>',
        '<p>This resource could not be found or is no longer available.</p>',
        '<p><a href="/resources">Back to Resources</a></p>',
        '</main>',
        renderSsrFooterHtml(),
      ].join('\n');

      return { bodyHtml, preloadPublicResources: null };
    }

    const bodyHtml = [
      renderSsrHeaderHtml(),
      '<main>',
      '<p>404</p>',
      '<h1>Page not found.</h1>',
      '<p>The page you are looking for could not be found.</p>',
      '<p><a href="/">Return Home</a> <a href="/services">View my service</a></p>',
      '</main>',
      renderSsrFooterHtml(),
    ].join('\n');

    return { bodyHtml, preloadPublicResources: null };
  }

  if (meta.isResourceIndex) {
    const publicResources = getPublicResources(entries);
    const featured = publicResources.filter((r) => r.featured && r.status === 'published');

    const featuredHtml =
      featured.length > 0
        ? [
            '<section aria-label="Featured Resources">',
            '<h2>Featured Resources</h2>',
            ...featured.slice(0, 2).map((item) =>
              [
                '<article>',
                item.category ? `<p>${escapeHtml(item.category)}</p>` : '',
                `<h3><a href="/resources/${escapeHtml(item.slug)}">${escapeHtml(item.title)}</a></h3>`,
                `<p>${escapeHtml(item.summary)}</p>`,
                `<p>${escapeHtml(item.format)}${item.readingTime ? ` · ${escapeHtml(item.readingTime)}` : ''}</p>`,
                '</article>',
              ].join('')
            ),
            '</section>',
          ].join('\n')
        : '';

    const listHtml =
      publicResources.length === 0
        ? [
            '<section aria-label="Resource Library">',
            '<p>New resources coming soon</p>',
            '<p>Practical guides, checklists, and operational frameworks are being prepared. Check back shortly or join the newsletter to be notified when they publish.</p>',
            '</section>',
          ].join('\n')
        : [
            '<section aria-label="All Resources">',
            ...publicResources.map((item) => {
              if (item.status === 'coming-soon') {
                return [
                  '<article>',
                  item.category ? `<p>${escapeHtml(item.category)}</p>` : '',
                  `<h2>${escapeHtml(item.title)}</h2>`,
                  `<p>${escapeHtml(item.summary)}</p>`,
                  `<p>Coming soon · ${escapeHtml(item.format)}</p>`,
                  '</article>',
                ].join('');
              }
              return [
                '<article>',
                item.category ? `<p>${escapeHtml(item.category)}</p>` : '',
                `<h2><a href="/resources/${escapeHtml(item.slug)}">${escapeHtml(item.title)}</a></h2>`,
                `<p>${escapeHtml(item.summary)}</p>`,
                `<p>${escapeHtml(item.format)}${item.readingTime ? ` · ${escapeHtml(item.readingTime)}` : ''}</p>`,
                '</article>',
              ].join('');
            }),
            '</section>',
          ].join('\n');

    const bodyHtml = [
      renderSsrHeaderHtml(),
      '<main>',
      '<section>',
      '<p>Resource Library</p>',
      '<h1>Practical Resources for Smarter Business Operations</h1>',
      '<p>Explore practical guides, frameworks, and implementation resources designed to help leaders understand AI, design better systems, and build operations that actually scale.</p>',
      '<p><a href="/newsletter">Join Newsletter</a></p>',
      '</section>',
      featuredHtml,
      listHtml,
      '<section>',
      '<h2>Want this built into how your business runs?</h2>',
      '<p>Book a 30-minute operational clarity audit to identify bottlenecks and design cleaner workflow execution.</p>',
      '<p><a href="/audit">Book a free audit</a></p>',
      '</section>',
      '</main>',
      renderSsrFooterHtml(),
    ]
      .filter(Boolean)
      .join('\n');

    return { bodyHtml, preloadPublicResources: publicResources };
  }

  if (meta.resource && meta.resource.status === 'published') {
    const publicResources = getPublicResources(entries);
    const pub = toPublicResource(meta.resource);
    const h1Text = resolveResourceH1(pub);
    const related = resolveRelatedResources(pub, publicResources, 3);

    const includesHtml =
      pub.includes && pub.includes.length > 0
        ? [
            '<section>',
            "<h2>What's inside</h2>",
            '<ul>',
            ...pub.includes.map((item) => `<li>${escapeHtml(item)}</li>`),
            '</ul>',
            '</section>',
          ].join('\n')
        : '';

    const audienceHtml = pub.audience
      ? `<section><h2>Who it's for</h2><p>${escapeHtml(pub.audience)}</p></section>`
      : '';

    const descriptionParagraphs = (pub.description || [])
      .map((para) => `<p>${escapeHtml(para)}</p>`)
      .join('\n');

    const howToUseHtml =
      pub.howToUse || descriptionParagraphs
        ? [
            '<section>',
            '<h2>How to use it</h2>',
            pub.howToUse ? `<p>${escapeHtml(pub.howToUse)}</p>` : '',
            descriptionParagraphs,
            '</section>',
          ]
            .filter(Boolean)
            .join('\n')
        : '';

    const faqHtml =
      pub.faq && pub.faq.length > 0
        ? [
            '<section>',
            '<h2>Frequently asked questions</h2>',
            ...pub.faq.map(
              (f) => `<article><h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p></article>`
            ),
            '</section>',
          ].join('\n')
        : '';

    const relatedHtml =
      related.length > 0
        ? [
            '<section>',
            '<h2>Related resources</h2>',
            '<ul>',
            ...related.map(
              (rel) =>
                `<li><a href="/resources/${escapeHtml(rel.slug)}">${escapeHtml(rel.title)}</a> — ${escapeHtml(rel.summary)}</li>`
            ),
            '</ul>',
            '</section>',
          ].join('\n')
        : '';

    const coverHtml = pub.coverImage
      ? `<img src="${escapeHtml(pub.coverImage)}" alt="${escapeHtml(pub.coverImageAlt || pub.title)}" width="1200" height="900" />`
      : '';

    const bodyHtml = [
      renderSsrHeaderHtml(),
      '<main>',
      '<nav aria-label="Breadcrumb">',
      '<ol>',
      '<li><a href="/">Home</a></li>',
      '<li><a href="/resources">Resources</a></li>',
      `<li aria-current="page">${escapeHtml(h1Text)}</li>`,
      '</ol>',
      '</nav>',
      '<p><a href="/resources">All resources</a></p>',
      '<article>',
      pub.category ? `<p>${escapeHtml(pub.category)}</p>` : '',
      `<h1>${escapeHtml(h1Text)}</h1>`,
      `<p>${escapeHtml(pub.summary)}</p>`,
      `<p>${escapeHtml(pub.format)}${pub.readingTime ? ` · ${escapeHtml(pub.readingTime)}` : ''}</p>`,
      coverHtml,
      audienceHtml,
      includesHtml,
      howToUseHtml,
      faqHtml,
      '</article>',
      relatedHtml,
      '<section>',
      '<h2>Want this built into how your business runs?</h2>',
      '<p>Book a 30-minute operational clarity audit to identify bottlenecks and design cleaner workflow execution.</p>',
      '<p><a href="/audit">Book a free audit</a></p>',
      '</section>',
      '</main>',
      renderSsrFooterHtml(),
    ]
      .filter(Boolean)
      .join('\n');

    return { bodyHtml, preloadPublicResources: publicResources };
  }

  return { bodyHtml: '', preloadPublicResources: null };
}

export function renderSeoHtmlDocument(
  htmlTemplate: string,
  rawPath: string,
  entries: readonly ResourceEntry[] = registryResources
): RenderSeoHtmlResult {
  const siteUrl = normalizeCanonicalSiteUrl(process.env.SITE_URL);
  const meta = resolvePageMeta(rawPath, entries);
  const safeTitle = escapeHtml(meta.title);
  const safeDesc = escapeHtml(meta.description);
  const safeUrl = escapeHtml(meta.url);
  const safeImage = escapeHtml(meta.image);
  const safeType = escapeHtml(meta.type || 'website');
  const safeRobots = escapeHtml(meta.robots);

  let out = htmlTemplate;

  out = out.replace(/<title>[^<]*<\/title>/gi, `<title>${safeTitle}</title>`);
  out = out.replace(
    /<meta\s+name="title"\s+content="[^"]*"/gi,
    `<meta name="title" content="${safeTitle}"`
  );
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"/gi,
    `<meta name="description" content="${safeDesc}"`
  );

  // Robots tag
  if (/<meta\s+name="robots"/i.test(out)) {
    out = out.replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/gi,
      `<meta name="robots" content="${safeRobots}" />`
    );
  } else {
    out = out.replace('</head>', `  <meta name="robots" content="${safeRobots}" />\n  </head>`);
  }

  // Open Graph tags
  out = out.replace(
    /<meta\s+property="og:type"\s+content="[^"]*"/gi,
    `<meta property="og:type" content="${safeType}"`
  );
  out = out.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"/gi,
    `<meta property="og:title" content="${safeTitle}"`
  );
  out = out.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"/gi,
    `<meta property="og:description" content="${safeDesc}"`
  );
  out = out.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"/gi,
    `<meta property="og:url" content="${safeUrl}"`
  );
  out = out.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"/gi,
    `<meta property="og:image" content="${safeImage}"`
  );

  // Twitter / X tags
  out = out.replace(
    /<meta\s+(?:property|name)="twitter:title"\s+content="[^"]*"/gi,
    `<meta name="twitter:title" content="${safeTitle}"`
  );
  out = out.replace(
    /<meta\s+(?:property|name)="twitter:description"\s+content="[^"]*"/gi,
    `<meta name="twitter:description" content="${safeDesc}"`
  );
  out = out.replace(
    /<meta\s+(?:property|name)="twitter:url"\s+content="[^"]*"/gi,
    `<meta name="twitter:url" content="${safeUrl}"`
  );
  out = out.replace(
    /<meta\s+(?:property|name)="twitter:image"\s+content="[^"]*"/gi,
    `<meta name="twitter:image" content="${safeImage}"`
  );

  // Canonical tag (omitted/removed on 404)
  if (meta.canonicalUrl) {
    const safeCanonical = escapeHtml(meta.canonicalUrl);
    if (/<link\s+rel="canonical"/i.test(out)) {
      out = out.replace(
        /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/gi,
        `<link rel="canonical" href="${safeCanonical}" />`
      );
    } else {
      out = out.replace('</head>', `  <link rel="canonical" href="${safeCanonical}" />\n  </head>`);
    }
  } else {
    out = out.replace(/\s*<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/gi, '');
  }

  // Structured JSON-LD
  out = out.replace(/<script\s+id="ssr-jsonld"[^>]*>[\s\S]*?<\/script>/gi, '');
  const jsonLd = buildStructuredDataGraph(meta, siteUrl, entries);
  if (jsonLd) {
    const jsonLdTag = `  <script id="ssr-jsonld" type="application/ld+json">${safeJsonLdStringify(jsonLd)}</script>`;
    out = out.replace('</head>', `${jsonLdTag}\n  </head>`);
  }

  // Crawlable body inside <div id="root"> and allowlisted preloaded public JSON
  const { bodyHtml, preloadPublicResources } = renderSsrBodyHtml(meta, entries);
  if (bodyHtml) {
    out = out.replace('<div id="root"></div>', `<div id="root">\n${bodyHtml}\n</div>`);
  }

  out = out.replace(/<script\s+id="__PRELOADED_RESOURCES__"[^>]*>[\s\S]*?<\/script>/gi, '');
  if (preloadPublicResources !== null) {
    const preloadScript = `<script id="__PRELOADED_RESOURCES__" type="application/json">${safeJsonLdStringify(preloadPublicResources)}</script>`;
    out = out.replace('</body>', `${preloadScript}\n  </body>`);
  }

  return {
    html: out,
    statusCode: meta.statusCode,
    isNotFound: meta.isNotFound,
    isResourceRoute: meta.isResourceRoute,
    meta,
  };
}

export function injectPageMetaIntoHtml(
  html: string,
  rawPath: string,
  entries: readonly ResourceEntry[] = registryResources
): string {
  return renderSeoHtmlDocument(html, rawPath, entries).html;
}
