import type { QuestionAnswerValue } from '../types/clarityMap.js';

export const VOLUME_BAND_LOW_MAX = 10;
export const VOLUME_BAND_HIGH_MIN = 30;

export type VolumeBand = 'unknown' | 'low' | 'medium' | 'high';
export type VolumeBasis = 'weekly' | 'monthly' | 'seasonal' | 'per_project';

export interface VolumeContext {
  runs_per_week: { min: number; max: number } | null;
  volume_band: VolumeBand;
  basis: VolumeBasis;
}

type AnswerLike =
  | Array<{ qid: string; answer: unknown }>
  | Record<string, QuestionAnswerValue>;

function getAnswerString(answers: AnswerLike, qid: string): string {
  let raw: unknown;
  if (Array.isArray(answers)) {
    raw = answers.find((a) => a.qid === qid)?.answer;
  } else {
    const entry = answers[qid];
    if (entry?.isNotSure) return 'Not sure';
    raw = entry?.answer;
  }

  if (raw === null || raw === undefined) return '';
  if (Array.isArray(raw)) return raw.map(String).join(', ').trim();
  return String(raw).trim();
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function parseCountRange(raw: string): { min: number; max: number } | null {
  const text = raw.trim();
  if (!text || /not\s*sure|unknown/i.test(text)) {
    return null;
  }

  const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)/i);
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    if (Number.isFinite(min) && Number.isFinite(max) && max >= min) {
      return { min, max };
    }
  }

  const plusMatch = text.match(/(\d+(?:\.\d+)?)\s*\+/);
  if (plusMatch) {
    const base = Number(plusMatch[1]);
    if (Number.isFinite(base)) {
      return { min: base, max: base };
    }
  }

  const singleMatch = text.match(/\b(\d+(?:\.\d+)?)\b/);
  if (singleMatch) {
    const num = Number(singleMatch[1]);
    if (Number.isFinite(num)) {
      return { min: num, max: num };
    }
  }

  return null;
}

export function volumeBandFromWeeklyMax(
  runsPerWeek: { min: number; max: number } | null
): VolumeBand {
  if (!runsPerWeek || !Number.isFinite(runsPerWeek.max)) {
    return 'unknown';
  }
  if (runsPerWeek.max < VOLUME_BAND_LOW_MAX) {
    return 'low';
  }
  if (runsPerWeek.max < VOLUME_BAND_HIGH_MIN) {
    return 'medium';
  }
  return 'high';
}

/**
 * Computes normalized volume_context from C1 (frequency) and C1b (count)
 * before sending the submission to Gemini so the AI never guesses volume math.
 */
export function computeVolumeContext(answers: AnswerLike): VolumeContext {
  const c1Raw = getAnswerString(answers, 'C1');
  const c1bRaw = getAnswerString(answers, 'C1b');
  const combined = `${c1Raw} ${c1bRaw}`.toLowerCase();

  // Explicit seasonal, irregular, or unconvertible cycle descriptions
  if (
    /season|irregular|ad\s*hoc|annual|year|quarter/i.test(combined) &&
    !/week|month|daily/i.test(c1Raw)
  ) {
    return {
      runs_per_week: null,
      volume_band: 'unknown',
      basis: 'seasonal',
    };
  }

  if (/season/i.test(c1bRaw)) {
    return {
      runs_per_week: null,
      volume_band: 'unknown',
      basis: 'seasonal',
    };
  }

  // Determine basis from C1
  let basis: VolumeBasis = 'weekly';
  const c1Lower = c1Raw.toLowerCase();

  if (!c1Lower || /not\s*sure|unknown/i.test(c1Lower)) {
    return {
      runs_per_week: null,
      volume_band: 'unknown',
      basis: 'weekly',
    };
  }

  if (c1Lower.includes('monthly') || c1Lower.includes('month')) {
    basis = 'monthly';
  } else if (c1Lower.includes('per project') || c1Lower.includes('project') || c1Lower.includes('case')) {
    basis = 'per_project';
  } else if (
    c1Lower.includes('daily') ||
    c1Lower.includes('day') ||
    c1Lower.includes('few times a week') ||
    c1Lower.includes('weekly') ||
    c1Lower.includes('week')
  ) {
    basis = 'weekly';
  } else {
    // Unconvertible custom period string
    return {
      runs_per_week: null,
      volume_band: 'unknown',
      basis: 'seasonal',
    };
  }

  const parsedCount = parseCountRange(c1bRaw);
  if (!parsedCount) {
    return {
      runs_per_week: null,
      volume_band: 'unknown',
      basis,
    };
  }

  const runs_per_week =
    basis === 'monthly' || basis === 'per_project'
      ? {
          min: roundOneDecimal(parsedCount.min / 4.3),
          max: roundOneDecimal(parsedCount.max / 4.3),
        }
      : {
          min: roundOneDecimal(parsedCount.min),
          max: roundOneDecimal(parsedCount.max),
        };

  return {
    runs_per_week,
    volume_band: volumeBandFromWeeklyMax(runs_per_week),
    basis,
  };
}
