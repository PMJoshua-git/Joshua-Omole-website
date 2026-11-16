import { z } from 'zod';
import type { QuestionnaireSubmission } from '../types/clarityMap.js';

export const answerItemSchema = z.object({
  qid: z.string().min(1).max(60),
  question: z.string().min(1).max(500),
  answer: z.union([
    z.string().max(1500),
    z.number(),
    z.boolean(),
    z.array(z.string().max(500)).max(25),
  ]),
  time_range: z.string().max(100).nullable().optional().default(null),
});

export const questionnaireSubmissionSchema = z.object({
  industry: z.string().min(1).max(120),
  industry_id: z.string().min(1).max(80),
  process_code: z.string().min(2).max(30),
  process_name: z.string().min(1).max(150),
  questionnaire_version: z.string().min(1).max(30),
  answers: z.array(answerItemSchema).min(1).max(50),
});

export const reportRequestSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address').max(254),
  analysis: z.unknown(),
});

/**
 * Strips common accidental personal identifiers (emails, long phone numbers, card/account strings)
 * before sending user-submitted answers to Gemini.
 */
export function sanitizeAnswerText(input: string): string {
  return input
    // Redact email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[redacted email]')
    // Redact phone-like sequences (8+ digits with optional separators)
    .replace(/(?:\+?\d[\d\s\-().]{7,}\d)/g, '[redacted number]')
    // Strip control characters
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

export function sanitizeSubmission(
  submission: z.infer<typeof questionnaireSubmissionSchema>
): {
  sanitized: QuestionnaireSubmission;
  redactedPII: boolean;
} {
  let redactedPII = false;

  const sanitizeString = (val: string): string => {
    const cleaned = sanitizeAnswerText(val);
    if (cleaned.includes('[redacted email]') || cleaned.includes('[redacted number]')) {
      redactedPII = true;
    }
    return cleaned;
  };

  const sanitizedAnswers = submission.answers.map((item) => {
    let cleanedAnswer: string | number | boolean | string[] = item.answer ?? '';
    if (typeof item.answer === 'string') {
      cleanedAnswer = sanitizeString(item.answer);
    } else if (Array.isArray(item.answer)) {
      cleanedAnswer = item.answer.map((entry) => sanitizeString(entry));
    }

    return {
      qid: item.qid,
      question: sanitizeString(item.question),
      answer: cleanedAnswer,
      time_range: item.time_range ? sanitizeString(item.time_range) : null,
    };
  });

  return {
    sanitized: {
      industry: submission.industry,
      industry_id: submission.industry_id,
      process_code: submission.process_code,
      process_name: submission.process_name,
      questionnaire_version: submission.questionnaire_version,
      answers: sanitizedAnswers,
    },
    redactedPII,
  };
}
