import industriesData from '../data/industries.json' with { type: 'json' };
import commonQuestionsData from '../data/common-questions.json' with { type: 'json' };
import realEstateProcesses from '../data/processes/real-estate.json' with { type: 'json' };
import ecommerceProcesses from '../data/processes/ecommerce.json' with { type: 'json' };
import retailProcesses from '../data/processes/retail.json' with { type: 'json' };
import coachingProcesses from '../data/processes/professional-coaching.json' with { type: 'json' };
import saasProcesses from '../data/processes/saas-tech.json' with { type: 'json' };
import profServicesProcesses from '../data/processes/professional-services.json' with { type: 'json' };
import healthcareProcesses from '../data/processes/healthcare-clinics.json' with { type: 'json' };
import logisticsProcesses from '../data/processes/logistics-supply-chain.json' with { type: 'json' };
import financialProcesses from '../data/processes/financial-services.json' with { type: 'json' };
import digitalAgencyProcesses from '../data/processes/digital-agencies.json' with { type: 'json' };
import b2bAgencyProcesses from '../data/processes/b2b-agencies.json' with { type: 'json' };
import b2cAgencyProcesses from '../data/processes/b2c-agencies.json' with { type: 'json' };

import type {
  IndustryDefinition,
  ProcessDefinition,
  QuestionDefinition,
  QuestionAnswerValue,
  QuestionCondition,
} from '../types/clarityMap.js';

const INDUSTRIES: IndustryDefinition[] = industriesData as IndustryDefinition[];

const COMMON_QUESTIONS: QuestionDefinition[] = commonQuestionsData as QuestionDefinition[];

const PROCESS_MAP: Record<string, ProcessDefinition[]> = {
  'real-estate': realEstateProcesses as ProcessDefinition[],
  'ecommerce': ecommerceProcesses as ProcessDefinition[],
  'retail': retailProcesses as ProcessDefinition[],
  'professional-coaching': coachingProcesses as ProcessDefinition[],
  'saas-tech': saasProcesses as ProcessDefinition[],
  'professional-services': profServicesProcesses as ProcessDefinition[],
  'healthcare-clinics': healthcareProcesses as ProcessDefinition[],
  'logistics-supply-chain': logisticsProcesses as ProcessDefinition[],
  'financial-services': financialProcesses as ProcessDefinition[],
  'digital-agencies': digitalAgencyProcesses as ProcessDefinition[],
  'b2b-agencies': b2bAgencyProcesses as ProcessDefinition[],
  'b2c-agencies': b2cAgencyProcesses as ProcessDefinition[],
};

const ALL_PROCESSES: ProcessDefinition[] = Object.values(PROCESS_MAP).flat();

export function getIndustries(): IndustryDefinition[] {
  return INDUSTRIES;
}

export function getIndustryById(industryId: string): IndustryDefinition | undefined {
  return INDUSTRIES.find((i) => i.id === industryId);
}

export function getProcessesByIndustry(industryId: string): ProcessDefinition[] {
  return PROCESS_MAP[industryId] ?? [];
}

export function getProcessByCode(processCode: string): ProcessDefinition | undefined {
  return ALL_PROCESSES.find((p) => p.process_code === processCode);
}

export function getAllProcesses(): ProcessDefinition[] {
  return ALL_PROCESSES;
}

export function getCommonQuestions(): QuestionDefinition[] {
  return COMMON_QUESTIONS;
}

export function getFullQuestionsForProcess(process: ProcessDefinition): QuestionDefinition[] {
  const omit = new Set(process.omitCommonQids ?? []);
  const common = COMMON_QUESTIONS.filter((q) => !omit.has(q.qid));
  return [...process.questions, ...common];
}

export function evaluateCondition(
  condition: QuestionCondition | undefined,
  answers: Record<string, QuestionAnswerValue>
): boolean {
  if (!condition) return true;
  const target = answers[condition.questionId];
  if (!target || target.answer === null || target.answer === undefined) return false;

  const val = target.answer;

  switch (condition.operator) {
    case 'equals':
      return val === condition.value;
    case 'not_equals':
      return val !== condition.value;
    case 'includes':
      if (Array.isArray(val)) return val.includes(String(condition.value));
      if (typeof val === 'string') return val.includes(String(condition.value));
      return false;
    case 'includes_any': {
      const candidates = Array.isArray(condition.value) ? condition.value : [String(condition.value)];
      if (Array.isArray(val)) return candidates.some((c) => val.includes(c));
      if (typeof val === 'string') return candidates.some((c) => val.includes(c));
      return false;
    }
    case 'min_selected': {
      if (Array.isArray(val)) {
        const meaningful = val.filter((item) => item !== 'Not sure');
        return meaningful.length >= Number(condition.value);
      }
      return false;
    }
    default:
      return true;
  }
}

export function getVisibleQuestions(
  process: ProcessDefinition,
  answers: Record<string, QuestionAnswerValue>
): QuestionDefinition[] {
  return getFullQuestionsForProcess(process).filter((q) => evaluateCondition(q.condition, answers));
}

export function getQuestionDisplayText(
  question: QuestionDefinition,
  answers: Record<string, QuestionAnswerValue>
): string {
  if (question.qid === 'C1b' && question.unitLabelByC1) {
    const c1Answer = answers['C1']?.answer;
    const unit =
      typeof c1Answer === 'string' && question.unitLabelByC1[c1Answer]
        ? question.unitLabelByC1[c1Answer]
        : 'per typical cycle';
    return `Roughly how many times does it happen ${unit}?`;
  }
  return question.question;
}
