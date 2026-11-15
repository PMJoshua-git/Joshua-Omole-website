export type BridgeLetter = 'B' | 'R' | 'I' | 'D' | 'G' | 'E';

export type WorkflowNodeType = 'task' | 'decision' | 'wait' | 'handoff' | 'end';

export interface WorkflowEdge {
  to: string;
  label: string;
}

export type PainFlag =
  | 'single_person_dependency'
  | 're_entry'
  | 'waiting'
  | 'no_owner'
  | 'no_record'
  | 'no_status'
  | 'rework_risk'
  | 'no_rule'
  | 'no_review';

export type ChangeType =
  | 'removed'
  | 'merged'
  | 'reordered'
  | 'standardised'
  | 'assigned'
  | 'rule_added'
  | 'step_added'
  | 'unchanged';

export type AutomationType =
  | 'capture_form'
  | 'auto_record'
  | 'sync_between_systems'
  | 'scheduled_reminder'
  | 'status_notification'
  | 'template_generation'
  | 'rule_based_routing'
  | 'approval_request'
  | 'payment_or_data_match'
  | 'dashboard_or_report'
  | 'assisted_by_ai';

export type QuestionInputType =
  | 'single_select'
  | 'multi_select'
  | 'short_text'
  | 'long_text'
  | 'numeric_range'
  | 'time_range';

export interface QuestionCondition {
  questionId: string;
  operator: 'equals' | 'includes' | 'includes_any' | 'not_equals' | 'min_selected';
  value: string | string[] | number;
}

export interface QuestionDefinition {
  qid: string;
  stage: string;
  question: string;
  helpText?: string;
  type: QuestionInputType;
  required?: boolean;
  options?: string[];
  allowOther?: boolean;
  allowNotSure?: boolean;
  placeholder?: string;
  unitLabelByC1?: Record<string, string>;
  condition?: QuestionCondition;
  isTimeQuestion?: boolean;
  privacyNote?: string;
}

export interface IndustryDefinition {
  id: string;
  name: string;
  shortDescription: string;
  iconName: string;
  regulated?: boolean;
  regulatedNotice?: string;
  processCount: number;
}

export interface ProcessDefinition {
  process_code: string;
  process_name: string;
  industry_id: string;
  industry_name: string;
  work_area: string;
  questionnaire_version: string;
  short_description: string;
  typical_lifecycle: string[];
  regulated?: boolean;
  regulated_notice?: string;
  questions: QuestionDefinition[];
  omitCommonQids?: string[];
}

export interface QuestionAnswerValue {
  qid: string;
  question: string;
  stage: string;
  answer: string | string[] | number | boolean | null;
  otherText?: string;
  time_range?: string | null;
  isNotSure?: boolean;
}

export interface QuestionnaireSubmission {
  industry: string;
  industry_id: string;
  process_code: string;
  process_name: string;
  questionnaire_version: string;
  answers: Array<{
    qid: string;
    question: string;
    answer: string | number | boolean | string[];
    time_range: string | null;
  }>;
}

export interface CurrentStateNode {
  id: string;
  label: string;
  type: WorkflowNodeType;
  actor: string;
  tool: string;
  time_min: number | null;
  time_max: number | null;
  next: string[];
  edges?: WorkflowEdge[];
  pain_flags: PainFlag[];
  inferred: boolean;
  evidence: string[];
}

export interface RedesignedStateNode {
  id: string;
  label: string;
  type: WorkflowNodeType;
  actor: string;
  tool: string;
  time_min: number | null;
  time_max: number | null;
  next: string[];
  edges?: WorkflowEdge[];
  change_type: ChangeType;
  bridge_letter: BridgeLetter;
  replaces: string[];
  rationale: string;
}

export interface RemovedActivity {
  replaces: string[];
  bridge_letter: BridgeLetter;
  reason: string;
}

export interface AutomatedStateNode {
  id: string;
  label: string;
  type: WorkflowNodeType;
  actor: string;
  tool: string;
  time_min: number | null;
  time_max: number | null;
  next: string[];
  edges?: WorkflowEdge[];
  automation: {
    type: AutomationType;
    description: string;
    function?: string;
    trigger?: string;
    input?: string;
    action?: string;
    exception_route?: string;
    owner?: string;
    human_checkpoint: string;
  };
  from: string[];
}

export interface NotAutomatedItem {
  step: string;
  reason: string;
}

export interface BridgeLensScore {
  score: number;
  finding: string;
  evidence: string[];
}

export interface BridgeDiagnosis {
  B: BridgeLensScore;
  R: BridgeLensScore;
  I: BridgeLensScore;
  D: BridgeLensScore;
  G: BridgeLensScore;
  E: BridgeLensScore;
}

export interface TimeRange {
  min: number | null;
  max: number | null;
}

export interface TimeEstimate {
  runs_per_week: TimeRange;
  hours_per_week: {
    current: TimeRange;
    redesigned: TimeRange;
    automated: TimeRange;
  };
  redesign_share_percent: TimeRange;
  assumptions: string[];
  caveat: string;
}

export interface Bottleneck {
  title: string;
  why_it_matters: string;
  step_ids: string[];
  bridge_letter: BridgeLetter;
}

export interface QuickWin {
  action: string;
  step_ids: string[];
  needs_new_software: boolean;
  time_to_do: 'under 1 hour' | 'half a day' | 'one week';
}

export interface AutomationOpportunity {
  name: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  step_ids: string[];
  verdict?: 'worth_it_now' | 'worth_it_later';
  why_this_volume?: string;
  revisit_when?: string | null;
}

export interface ImplementationWeek {
  week: number;
  focus: string;
  actions: string[];
  includes_baseline?: boolean;
}

export type AutomatedStateStatus = 'recommended' | 'limited' | 'not_yet';

export interface ClarityMapResult {
  schema_version?: 1 | 2;
  meta: {
    industry: string;
    process_code: string;
    process_name: string;
    questionnaire_version: string;
    analysis_version: string;
  };
  confidence: 'high' | 'medium' | 'low';
  summary: {
    headline: string;
    paragraph: string;
  };
  current_state: {
    nodes: CurrentStateNode[];
    visibility_gaps: string[];
  };
  bridge_diagnosis: BridgeDiagnosis;
  redesigned_state: {
    nodes: RedesignedStateNode[];
    removed: RemovedActivity[];
    rules_introduced: string[];
  };
  automated_state: {
    status?: AutomatedStateStatus;
    reason?: string | null;
    revisit_when?: string | null;
    nodes: AutomatedStateNode[];
    not_automated: NotAutomatedItem[];
  };
  time_estimate: TimeEstimate;
  bottlenecks: Bottleneck[];
  quick_wins: QuickWin[];
  automation_opportunities: AutomationOpportunity[];
  implementation_order: ImplementationWeek[];
  readiness: {
    score_percent: number;
    band: 'Fragile' | 'Developing' | 'Ready to scale';
  };
  crm_tags: {
    industry: string;
    process_code: string;
    readiness_band: string;
    top_bottleneck_bridge_letter: string;
    volume_band: string;
  };
  cta: string;
}

export type ClarityMapStage = 'current' | 'redesigned' | 'automated';
