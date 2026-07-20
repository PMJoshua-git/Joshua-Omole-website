import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
