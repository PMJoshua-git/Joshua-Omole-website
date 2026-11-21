import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';

import apiApp from './server/apiApp.js';
import { validateResourceRegistry } from './server/resources/registry.js';
import { injectPageMetaIntoHtml } from './server/seo/pageMeta.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.set('trust proxy', 1);

// Mount all shared API routes
app.use(apiApp);

// Permanent redirects
app.get('/contact', (_req, res) => {
  res.redirect(301, '/audit');
});

app.get(['/knowledge-hub', '/knowledge'], (_req, res) => {
  res.redirect(301, '/resources');
});

async function startServer() {
  validateResourceRegistry();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));

    app.get('*', (req, res, next) => {
      if (req.path.includes('.') || req.path.startsWith('/api')) {
        return next();
      }

      const filePath = path.join(distPath, 'index.html');
      fs.readFile(filePath, 'utf8', (err, html) => {
        if (err) {
          console.error('Error reading index.html:', err);
          return res.sendFile(filePath);
        }

        const customizedHtml = injectPageMetaIntoHtml(html, req.path);
        res.send(customizedHtml);
      });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
