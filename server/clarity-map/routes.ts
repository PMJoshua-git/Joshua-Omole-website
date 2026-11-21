import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  handleAnalyzeRequest,
  handleLimitStatusRequest,
  handleReportRequest,
} from './handlers.js';
import { handleHealthRequest } from './health.js';

const router = Router();

// Keep anti-spam protection on email delivery endpoint; AI generation limits
// are enforced by the Redis sliding-window limiter inside handleAnalyzeRequest.
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many report requests right now. Please wait a few minutes and try again.' },
});

router.get('/health', (req, res) => handleHealthRequest(req, res));

router.get('/limit-status', (req, res) => handleLimitStatusRequest(req, res));

router.post('/analyze', (req, res) => handleAnalyzeRequest(req, res));

router.post('/report', reportLimiter, (req, res) => handleReportRequest(req, res));

export default router;
