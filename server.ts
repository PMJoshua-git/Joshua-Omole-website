import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes
import bookConsultationRouter from "./services/api/book-consultation";
import newsletterSubscribeRouter from "./services/api/newsletter-subscribe";
import resourceAccessRouter from "./services/api/resource-access";
import resourcesRouter from "./services/api/resources";
import trainingSessionsRouter from "./services/api/training-sessions";
import bookTrainingRouter from "./services/api/book-training";

app.use("/api/book-consultation", bookConsultationRouter);
app.use("/api/newsletter-subscribe", newsletterSubscribeRouter);
app.use("/api/resource-access", resourceAccessRouter);
app.use("/api/resources", resourcesRouter);
app.use("/api/training-sessions", trainingSessionsRouter);
app.use("/api/book-training", bookTrainingRouter);

// Secure proxy routes matching the Vercel Serverless Functions
app.post("/api/subscribe", async (req, res) => {
  const { email, firstName, lastName, mailingLists, userGroup } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const response = await fetch("https://app.loops.so/api/v1/contacts/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LOOPS_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        firstName: firstName || "",
        lastName: lastName || "",
        mailingLists: mailingLists || {},
        userGroup: userGroup || "",
        source: "joshuaomole.com",
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error("Loops API error:", data);
      return res.status(response.status).json({ error: "Failed to add contact to Loops", details: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Loops function error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/save-contact", async (req, res) => {
  const { tableName, fields } = req.body;

  if (!tableName || !fields) {
    return res.status(400).json({ error: "tableName and fields are required" });
  }

  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    console.error("Missing Airtable environment variables");
    return res.status(500).json({ error: "Server configuration error" });
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
      console.error("Airtable API error:", data);
      return res.status(response.status).json({ error: "Failed to save to Airtable", details: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Airtable function error:", error);
    return res.status(500).json({ error: "Internal server error" });
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
  "/knowledge-hub": {
    title: "Knowledge Hub | Joshua Omole | Business Operations & AI Systems Strategist",
    description: "Practical resource library. Explore guides, checklists, frameworks, and tools designed to help you build smarter business operations.",
    url: "https://joshuaomole.com/knowledge-hub"
  }
};

async function startServer() {
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

        const meta = META_MAP[cleanPath] || META_MAP["/"];

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

        res.send(customizedHtml);
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
