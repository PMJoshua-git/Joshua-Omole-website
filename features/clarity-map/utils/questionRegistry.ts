import { getAllProcesses, getCommonQuestions } from '../services/processLibrary';

const EXPLICIT_QUESTION_LABELS: Record<string, string> = {
  // Common questions
  C1: 'How often it runs',
  C1b: 'How many per week or month',
  C2: 'People involved',
  C3: 'Where information lives',
  C3_master: 'Main source of truth',
  C4: 'What goes wrong',
  C_approval_who: 'Who approves and when',
  C5: 'Biggest frustration',
  C6: 'Total active time',
  C7: 'Where waiting happens',
  C8: 'Process consistency',
  C9: 'How completion is confirmed',
  C10: 'How performance is reviewed',

  // Real Estate RE-03 explicit labels
  RE03_Q1: 'How requests arrive',
  RE03_Q2: 'How urgency is decided',
  RE03_Q3: 'Who decides inspections',
  RE03_Q4: 'Spending limits and owner approval',
  RE03_Q5: 'How contractors are selected and briefed',
  RE03_Q6: 'How completed work is confirmed',
  RE03_Q7: 'How costs, photos and repeat faults are logged',
};

function condenseQuestionToLabel(questionText: string): string {
  const cleaned = questionText
    .replace(/\?/g, '')
    .replace(/^(Roughly |Currently |Usually )/i, '')
    .split(/,|;|\band what\b|\band how\b|\band who\b/i)[0]
    .trim();

  const words = cleaned.split(/\s+/).slice(0, 7);
  const joined = words.join(' ').trim();
  if (!joined) return 'Your answers';
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

function buildQuestionLabelMap(): Record<string, string> {
  const registry: Record<string, string> = { ...EXPLICIT_QUESTION_LABELS };

  for (const commonQ of getCommonQuestions()) {
    if (!registry[commonQ.qid]) {
      registry[commonQ.qid] = condenseQuestionToLabel(commonQ.question);
    }
  }

  for (const proc of getAllProcesses()) {
    for (const q of proc.questions) {
      if (!registry[q.qid]) {
        registry[q.qid] = condenseQuestionToLabel(q.question);
      }
    }
  }

  return registry;
}

export const QUESTION_LABEL_REGISTRY: Record<string, string> = buildQuestionLabelMap();

export function getQuestionLabel(qid: string): string {
  const label = QUESTION_LABEL_REGISTRY[qid];
  if (label) {
    return label;
  }
  console.warn(`[ClarityMap] Question id "${qid}" missing from question label registry; falling back to generic phrase.`);
  return 'your answers';
}

export function resolveEvidenceLabels(qids: string[]): string[] {
  if (!Array.isArray(qids) || qids.length === 0) {
    return [];
  }
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const qid of qids) {
    const label = getQuestionLabel(qid);
    const normalizedKey = label.toLowerCase();
    if (!seen.has(normalizedKey)) {
      seen.add(normalizedKey);
      labels.push(label);
    }
  }

  return labels;
}
