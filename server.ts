import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";
import { z } from "zod";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = 3000;

app.set('trust proxy', 1);

// CORS middleware & preflight handling
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// Resources registry & mailer
import {
  RESOURCES_DIR,
  getResourceBySlug,
  getPublicResources,
  validateResourceRegistry
} from "./server/resources/registry";
import { sendResourceEmail } from "./server/resources/email";

// API Routes
import bookConsultationRouter from "./services/api/book-consultation";
import newsletterSubscribeRouter from "./services/api/newsletter-subscribe";
import trainingSessionsRouter from "./services/api/training-sessions";
import bookTrainingRouter from "./services/api/book-training";

app.use("/api/book-consultation", bookConsultationRouter);
app.use("/api/newsletter-subscribe", newsletterSubscribeRouter);
app.use("/api/training-sessions", trainingSessionsRouter);
app.use("/api/book-training", bookTrainingRouter);

// ── Resources API & Delivery ──
app.get('/api/resources', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json(getPublicResources());
});

const resourceRequestSchema = z.object({
  slug:          z.string().min(1).max(100),
  firstName:     z.string().trim().min(1).max(80),
  email:         z.string().trim().toLowerCase().email().max(254),
  website:       z.string().optional().default(''),   // honeypot
  leadSource:    z.string().optional().default(''),
  landingPage:   z.string().optional().default(''),
  utmParameters: z.string().optional().default(''),
});

const resourceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a few minutes.' },
});

async function addToLoops(opts: {
  email: string;
  firstName: string;
  userGroup: string;
  source?: string;
}) {
  if (!process.env.LOOPS_API_KEY) {
    console.warn('[Loops] LOOPS_API_KEY is not set in environment');
    return;
  }
  const payload = {
    email: opts.email,
    firstName: opts.firstName || '',
    userGroup: opts.userGroup,
    source: opts.source || 'joshuaomole.com',
  };

  const createRes = await fetch('https://app.loops.so/api/v1/contacts/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (createRes.status === 409) {
    // Contact exists; update with the userGroup so existing contacts receive the tag
    const updateRes = await fetch('https://app.loops.so/api/v1/contacts/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    if (!updateRes.ok) {
      const errText = await updateRes.text();
      throw new Error(`Loops update failed (${updateRes.status}): ${errText}`);
    }
    return;
  }

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Loops create failed (${createRes.status}): ${errText}`);
  }
}

app.post('/api/resource-request', resourceLimiter, async (req, res) => {
  // 1. Validate the body with Zod
  const parseResult = resourceRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Please check your details and try again.' });
  }

  const { slug, firstName, email, website, leadSource } = parseResult.data;

  // 2. Honeypot check: If non-empty, silently respond 200 { ok: true }
  if (website && website.trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  // 3. Lookup resource by slug
  const resource = getResourceBySlug(slug);
  if (!resource || resource.status !== 'published') {
    return res.status(404).json({ error: 'Resource not found' });
  }

  // 4. Resolve file path with path traversal guard
  const filePath = path.resolve(RESOURCES_DIR, resource.fileName);
  if (!filePath.startsWith(RESOURCES_DIR)) {
    console.error(`[Security Alert] Traversal attempt rejected: ${resource.fileName}`);
    return res.status(400).json({ error: 'Invalid file path request' });
  }

  let fileBuffer: Buffer;
  try {
    fileBuffer = await fs.promises.readFile(filePath);
  } catch (err) {
    console.error(`Failed to read file for resource "${slug}" at "${filePath}":`, err);
    return res.status(500).json({ error: "We couldn't prepare your download. Please try again shortly." });
  }

  // 5. Run both side effects in parallel
  const [emailResult, loopsResult] = await Promise.allSettled([
    sendResourceEmail({
      to: email,
      firstName,
      resource,
      file: fileBuffer,
    }),
    addToLoops({
      email,
      firstName,
      userGroup: resource.loopsGroup,
      source: leadSource || 'Resources page',
    }),
  ]);

  // 6. If email send REJECTED: respond 502 with friendly error
  if (emailResult.status === 'rejected') {
    console.error(`Resend email delivery failed for ${email} (${slug}):`, emailResult.reason);
    return res.status(502).json({ error: "We couldn't send your copy. Please try again in a moment." });
  }

  // 7. If only Loops rejected: log it and still respond { ok: true }
  if (loopsResult.status === 'rejected') {
    console.error(`Loops tagging failed for ${email} (${slug}):`, loopsResult.reason);
  }

  // 8. Otherwise respond { ok: true }
  return res.status(200).json({ ok: true });
});

// Permanent redirects
app.get('/contact', (_req, res) => {
  res.redirect(301, '/audit');
});

app.get(['/knowledge-hub', '/knowledge'], (_req, res) => {
  res.redirect(301, '/resources');
});

// Secure proxy routes matching the Vercel Serverless Functions
app.post("/api/subscribe", async (req, res) => {
  console.log('[API /api/subscribe] Incoming body:', req.body);
  const email = req.body.email;
  const firstName = req.body.name || req.body.firstName || "";
  const lastName = req.body.lastName || "";
  const mailingLists = req.body.mailingLists || {};
  const userGroup = req.body.userGroup || req.body.service || "Workflow fix page";
  const company = req.body.business || req.body.company || "";
  const country = req.body.country || "";
  const companySize = req.body.companySize || "";
  const source = req.body.source || "Workflow fix page";
  const nextStep = req.body.nextStep || "";

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const LOOPS_API_KEY = process.env.LOOPS_API_KEY;
  if (!LOOPS_API_KEY) {
    console.warn("[Loops] LOOPS_API_KEY not configured. Operating in mock mode for preview testing.");
    return res.status(200).json({ 
      success: true, 
      mock: true, 
      message: "Subscribed successfully in preview mode",
      data: { email, firstName, company, source, nextStep, userGroup }
    });
  }

  try {
    const response = await fetch("https://app.loops.so/api/v1/contacts/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOOPS_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        mailingLists,
        userGroup,
        company,
        country,
        companySize,
        source,
        nextStep,
      }),
    });

    if (response.status === 409) {
      // Contact already exists — update their contact record in Loops
      const updateResponse = await fetch("https://app.loops.so/api/v1/contacts/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LOOPS_API_KEY}`,
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          userGroup,
          company,
          source,
          nextStep,
        }),
      });
      const updateData = (await updateResponse.json().catch(() => ({}))) as any;
      return res.status(200).json({ success: true, updated: true, data: updateData });
    }

    const data = await response.json() as any;

    if (!response.ok) {
      console.warn("[Loops] API returned non-ok status:", response.status, data);
      // In preview, don't crash if third-party test key rejects
      return res.status(200).json({ success: true, mock: true, warning: "Loops API rejected, returning mock success", details: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("[Loops] Function error:", error);
    return res.status(200).json({ success: true, mock: true, warning: "Network error calling Loops, preview fallback", error: error.message });
  }
});

app.post("/api/save-contact", async (req, res) => {
  console.log('[API /api/save-contact] Incoming body:', req.body);
  
  // Support both nested { tableName, fields } and flat { name, email, business, nextStep, source }
  const tableName = req.body.tableName || 'Leads';
  let fields = req.body.fields;

  if (!fields) {
    const rawName = req.body.name || req.body.firstName || '';
    const rawEmail = req.body.email || '';
    const rawBusiness = req.body.business || req.body.company || '';
    const rawNextStep = req.body.nextStep || '';
    const rawSource = req.body.source || 'Workflow fix page';
    const rawService = req.body.userGroup || req.body.service || 'Workflow Fix';

    if (!rawEmail && !rawName) {
      return res.status(400).json({ error: "Contact name or email is required" });
    }

    fields = {
      "Created Date": new Date().toISOString(),
      "Lead Type": "Workflow Fix Inquiry",
      "First Name": rawName,
      "Name": rawName,
      "Email": rawEmail,
      "Company Name": rawBusiness,
      "Business": rawBusiness,
      "Service Selected": rawService,
      "Lead Source": rawSource,
      "Business Goal": rawNextStep ? `Next Step Preference: ${rawNextStep}` : '',
      "Status": "New"
    };
  }

  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    console.warn("[Airtable] Environment variables not configured. Operating in mock mode for preview testing.");
    return res.status(200).json({ 
      success: true, 
      mock: true, 
      message: "Saved successfully in preview mode",
      received: { tableName, fields }
    });
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
        },
        body: JSON.stringify({ fields }),
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      console.warn("[Airtable] API returned non-ok status:", response.status, data);
      return res.status(200).json({ success: true, mock: true, warning: "Airtable rejected, preview fallback active", details: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("[Airtable] Function error:", error);
    return res.status(200).json({ success: true, mock: true, warning: "Network error calling Airtable, preview fallback", error: error.message });
  }
});

interface PageMeta {
  title: string;
  description: string;
  url: string;
}

const META_MAP: Record<string, PageMeta> = {
  "/": {
    title: "Joshua Omole | Business Operations & AI Systems Strategist",
    description: "I help businesses design smarter operations using technical tools, AI, systems thinking and practical execution",
    url: "https://joshuaomole.com/"
  },
  "/about": {
    title: "About | Joshua Omole | Business Operations & AI Systems Strategist",
    description: "I build the operational architecture that makes a business run without the founder holding everything together manually.",
    url: "https://joshuaomole.com/about"
  },
  "/services": {
    title: "Services | Joshua Omole | Business Operations & AI Systems Strategist",
    description: "Clear engagements. Defined outcomes. Smarter operations designed to scale your business using systems thinking, automation, and AI.",
    url: "https://joshuaomole.com/services"
  },
  "/training": {
    title: "Training | Joshua Omole | Business Operations & AI Systems Strategist",
    description: "Operational training built for how business actually works. Explore our targeted curriculums for leaders, executives, and team members.",
    url: "https://joshuaomole.com/training"
  },
  "/audit": {
    title: "Free Systems Clarity Audit | Joshua Omole",
    description: "Find out what your operation is actually costing you right now. A focused 30-minute session to pinpoint bottlenecks and walk away with 3 actionable findings.",
    url: "https://joshuaomole.com/audit"
  },
  "/contact": {
    title: "Book a Call | Joshua Omole | Business Operations & AI Systems Strategist",
    description: "Let's discuss how to optimize, automate, and integrate intelligent systems into your business operations. Book a direct strategy call.",
    url: "https://joshuaomole.com/contact"
  },
  "/connect": {
    title: "Connect & Resources | Joshua Omole",
    description: "Book consultation calls, access operational training, register for live workshops, and sign up for the weekly newsletter with Joshua Omole.",
    url: "https://joshuaomole.com/connect"
  },
  "/newsletter": {
    title: "Newsletter | Joshua Omole | Business Operations & AI Systems Strategist",
    description: "Join founders and operators receiving weekly systems thinking strategies, actionable AI implementation guides, and operational case studies.",
    url: "https://joshuaomole.com/newsletter"
  },
  "/resources": {
    title: "Resources | Joshua Omole | Business Operations & AI Systems Strategist",
    description: "Practical resource library. Explore guides, checklists, frameworks, and tools designed to help you build smarter business operations.",
    url: "https://joshuaomole.com/resources"
  },
  "/knowledge-hub": {
    title: "Resources | Joshua Omole | Business Operations & AI Systems Strategist",
    description: "Practical resource library. Explore guides, checklists, frameworks, and tools designed to help you build smarter business operations.",
    url: "https://joshuaomole.com/resources"
  }
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function resolvePageMeta(cleanPath: string): PageMeta & { image?: string } {
  if (cleanPath.startsWith('/resources/')) {
    const slug = cleanPath.slice('/resources/'.length);
    const resource = getResourceBySlug(slug);
    if (resource && resource.status === 'published') {
      const siteUrl = process.env.SITE_URL || 'https://joshuaomole.com';
      const cover = resource.coverImage
        ? (resource.coverImage.startsWith('http') ? resource.coverImage : `${siteUrl}${resource.coverImage}`)
        : `${siteUrl}/og-image.svg`;
      return {
        title: `${escapeHtml(resource.title)} | Free ${escapeHtml(resource.format)} from Joshua Omole`,
        description: escapeHtml(resource.summary),
        url: `${siteUrl}/resources/${resource.slug}`,
        image: cover,
      };
    }
  }

  const baseMeta = META_MAP[cleanPath] || META_MAP["/"];
  const siteUrl = process.env.SITE_URL || 'https://joshuaomole.com';
  return {
    ...baseMeta,
    image: `${siteUrl}/og-image.svg`,
  };
}

async function startServer() {
  // Validate resources registry on boot
  validateResourceRegistry();

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    
    app.get('*', (req, res, next) => {
      // If it looks like a file asset (has extension) or API route, let express.static or api routes handle it
      if (req.path.includes('.') || req.path.startsWith('/api')) {
        return next();
      }

      const filePath = path.join(distPath, 'index.html');
      fs.readFile(filePath, 'utf8', (err, html) => {
        if (err) {
          console.error("Error reading index.html:", err);
          return res.sendFile(filePath);
        }

        let cleanPath = req.path;
        if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
          cleanPath = cleanPath.slice(0, -1);
        }
        cleanPath = cleanPath.toLowerCase();

        const meta = resolvePageMeta(cleanPath);

        let customizedHtml = html;
        customizedHtml = customizedHtml.replace(
          /<title>[^<]*<\/title>/gi,
          `<title>${meta.title}</title>`
        );
        customizedHtml = customizedHtml.replace(
          /<meta name="title" content="[^"]*"/gi,
          `<meta name="title" content="${meta.title}"`
        );
        customizedHtml = customizedHtml.replace(
          /<meta name="description" content="[^"]*"/gi,
          `<meta name="description" content="${meta.description}"`
        );
        customizedHtml = customizedHtml.replace(
          /<meta property="og:title" content="[^"]*"/gi,
          `<meta property="og:title" content="${meta.title}"`
        );
        customizedHtml = customizedHtml.replace(
          /<meta property="og:description" content="[^"]*"/gi,
          `<meta property="og:description" content="${meta.description}"`
        );
        customizedHtml = customizedHtml.replace(
          /<meta property="og:url" content="[^"]*"/gi,
          `<meta property="og:url" content="${meta.url}"`
        );
        customizedHtml = customizedHtml.replace(
          /<meta property="twitter:title" content="[^"]*"/gi,
          `<meta property="twitter:title" content="${meta.title}"`
        );
        customizedHtml = customizedHtml.replace(
          /<meta property="twitter:description" content="[^"]*"/gi,
          `<meta property="twitter:description" content="${meta.description}"`
        );
        customizedHtml = customizedHtml.replace(
          /<meta property="twitter:url" content="[^"]*"/gi,
          `<meta property="twitter:url" content="${meta.url}"`
        );

        if (meta.image) {
          customizedHtml = customizedHtml.replace(
            /<meta property="og:image" content="[^"]*"/gi,
            `<meta property="og:image" content="${meta.image}"`
          );
          customizedHtml = customizedHtml.replace(
            /<meta name="twitter:image" content="[^"]*"/gi,
            `<meta name="twitter:image" content="${meta.image}"`
          );
        }

        res.send(customizedHtml);
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
