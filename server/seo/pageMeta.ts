import { getResourceBySlug } from '../resources/registry.js';

export interface PageMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  type?: 'website' | 'article';
}

function normalizeSiteUrl(raw?: string): string {
  const base = (raw || 'https://joshuaomole.com').trim();
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

export function normalizePathname(rawPath: string): string {
  const pathOnly = (rawPath || '/').split('?')[0].split('#')[0].trim();
  let clean = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  return clean.toLowerCase();
}

export function escapeHtml(str: string): string {
  return str
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

export function resolvePageMeta(rawPath: string): PageMeta {
  const siteUrl = normalizeSiteUrl(process.env.SITE_URL);
  const cleanPath = normalizePathname(rawPath);
  const defaultImage = `${siteUrl}/images/joshua-portrait.png`;

  if (cleanPath.startsWith('/resources/')) {
    const slug = cleanPath.slice('/resources/'.length);
    const resource = getResourceBySlug(slug);
    if (resource && resource.status === 'published') {
      const cover = resource.coverImage
        ? resource.coverImage.startsWith('http')
          ? resource.coverImage
          : `${siteUrl}${resource.coverImage}`
        : defaultImage;

      return {
        title: `${resource.title} | Free ${resource.format} from Joshua Omole`,
        description: resource.summary,
        url: `${siteUrl}/resources/${resource.slug}`,
        image: cover,
        type: 'article',
      };
    }
  }

  const matched = ROUTE_META_MAP[cleanPath] || ROUTE_META_MAP['/'];
  const canonicalPath = matched.canonicalPath ?? cleanPath;

  return {
    title: matched.title,
    description: matched.description,
    url: `${siteUrl}${canonicalPath === '/' ? '/' : canonicalPath}`,
    image: matched.imagePath ? `${siteUrl}${matched.imagePath}` : defaultImage,
    type: 'website',
  };
}

export function injectPageMetaIntoHtml(html: string, rawPath: string): string {
  const meta = resolvePageMeta(rawPath);
  const safeTitle = escapeHtml(meta.title);
  const safeDesc = escapeHtml(meta.description);
  const safeUrl = escapeHtml(meta.url);
  const safeImage = escapeHtml(meta.image);
  const safeType = escapeHtml(meta.type || 'website');

  let out = html;

  out = out.replace(/<title>[^<]*<\/title>/gi, `<title>${safeTitle}</title>`);
  out = out.replace(
    /<meta\s+name="title"\s+content="[^"]*"/gi,
    `<meta name="title" content="${safeTitle}"`
  );
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"/gi,
    `<meta name="description" content="${safeDesc}"`
  );

  // Open Graph tags (WhatsApp, LinkedIn, Facebook, iMessage, Slack)
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

  // Twitter / X tags (support both property= and name= variants)
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

  if (/<link\s+rel="canonical"/i.test(out)) {
    out = out.replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/gi,
      `<link rel="canonical" href="${safeUrl}" />`
    );
  } else {
    out = out.replace('</head>', `  <link rel="canonical" href="${safeUrl}" />\n  </head>`);
  }

  return out;
}
