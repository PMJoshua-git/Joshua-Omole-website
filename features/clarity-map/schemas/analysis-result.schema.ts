import { z } from 'zod';
import type {
  BridgeDiagnosis,
  ClarityMapResult,
  TimeEstimate,
  WorkflowEdge,
} from '../types/clarityMap';
import type { VolumeContext } from '../services/volumeContext';

export const bridgeLetterSchema = z.enum(['B', 'R', 'I', 'D', 'G', 'E']);
export const nodeTypeSchema = z.enum(['task', 'decision', 'wait', 'handoff', 'end']);
export const painFlagSchema = z.enum([
  'single_person_dependency',
  're_entry',
  'waiting',
  'no_owner',
  'no_record',
  'no_status',
  'rework_risk',
  'no_rule',
  'no_review',
]);

export const changeTypeSchema = z.enum([
  'removed',
  'merged',
  'reordered',
  'standardised',
  'assigned',
  'rule_added',
  'step_added',
  'unchanged',
]);

export const automationTypeSchema = z.enum([
  'capture_form',
  'auto_record',
  'sync_between_systems',
  'scheduled_reminder',
  'status_notification',
  'template_generation',
  'rule_based_routing',
  'approval_request',
  'payment_or_data_match',
  'dashboard_or_report',
  'assisted_by_ai',
]);

export const LOW_VOLUME_ALLOWED_AUTOMATION_TYPES = new Set([
  'capture_form',
  'scheduled_reminder',
  'status_notification',
  'template_generation',
]);

export const workflowEdgeSchema = z.object({
  to: z.string().min(1),
  label: z.string().max(80),
});

export const currentNodeSchema = z.object({
  id: z.string().regex(/^c\d+$/),
  label: z.string().min(1).max(120),
  type: nodeTypeSchema,
  actor: z.string().min(1).max(120),
  tool: z.string().max(120),
  time_min: z.number().min(0).nullable(),
  time_max: z.number().min(0).nullable(),
  next: z.array(z.string()),
  edges: z.array(workflowEdgeSchema).optional(),
  pain_flags: z.array(painFlagSchema),
  inferred: z.boolean(),
  evidence: z.array(z.string()),
});

export const redesignedNodeSchema = z.object({
  id: z.string().regex(/^r\d+$/),
  label: z.string().min(1).max(120),
  type: nodeTypeSchema,
  actor: z.string().min(1).max(120),
  tool: z.string().max(120),
  time_min: z.number().min(0).nullable(),
  time_max: z.number().min(0).nullable(),
  next: z.array(z.string()),
  edges: z.array(workflowEdgeSchema).optional(),
  change_type: changeTypeSchema,
  bridge_letter: bridgeLetterSchema,
  replaces: z.array(z.string()),
  rationale: z.string().min(1).max(400),
});

export const automatedNodeSchema = z.object({
  id: z.string().regex(/^a\d+$/),
  label: z.string().min(1).max(120),
  type: nodeTypeSchema,
  actor: z.string().min(1).max(120),
  tool: z.string().max(120),
  time_min: z.number().min(0).nullable(),
  time_max: z.number().min(0).nullable(),
  next: z.array(z.string()),
  edges: z.array(workflowEdgeSchema).optional(),
  automation: z.object({
    type: automationTypeSchema,
    description: z.string().min(1).max(500),
    function: z.string().max(240).optional(),
    trigger: z.string().max(240).optional(),
    input: z.string().max(240).optional(),
    action: z.string().max(240).optional(),
    exception_route: z.string().max(240).optional(),
    owner: z.string().max(160).optional(),
    human_checkpoint: z.string().min(1).max(300),
  }),
  from: z.array(z.string()),
});

export const bridgeLensScoreSchema = z.object({
  score: z.number().int().min(0).max(4),
  finding: z.string().min(1).max(400),
  evidence: z.array(z.string()),
});

export const timeRangeSchema = z.object({
  min: z.number().min(0).nullable(),
  max: z.number().min(0).nullable(),
});

export const clarityMapResultSchema = z.object({
  schema_version: z.union([z.literal(1), z.literal(2)]).optional(),
  meta: z.object({
    industry: z.string().min(1),
    process_code: z.string().min(1),
    process_name: z.string().min(1),
    questionnaire_version: z.string().min(1),
    analysis_version: z.string().min(1),
  }),
  confidence: z.enum(['high', 'medium', 'low']),
  summary: z.object({
    headline: z.string().min(1).max(200),
    paragraph: z.string().min(1).max(1500),
  }),
  current_state: z.object({
    nodes: z.array(currentNodeSchema).max(12),
    visibility_gaps: z.array(z.string()),
  }),
  bridge_diagnosis: z.object({
    B: bridgeLensScoreSchema,
    R: bridgeLensScoreSchema,
    I: bridgeLensScoreSchema,
    D: bridgeLensScoreSchema,
    G: bridgeLensScoreSchema,
    E: bridgeLensScoreSchema,
  }),
  redesigned_state: z.object({
    nodes: z.array(redesignedNodeSchema).max(12),
    removed: z.array(
      z.object({
        replaces: z.array(z.string()),
        bridge_letter: bridgeLetterSchema,
        reason: z.string().min(1),
      })
    ),
    rules_introduced: z.array(z.string()),
  }),
  automated_state: z.object({
    status: z.enum(['recommended', 'limited', 'not_yet']).optional(),
    reason: z.string().nullable().optional(),
    revisit_when: z.string().nullable().optional(),
    nodes: z.array(automatedNodeSchema).max(12),
    not_automated: z.array(
      z.object({
        step: z.string().min(1),
        reason: z.string().min(1),
      })
    ),
  }),
  time_estimate: z.object({
    runs_per_week: timeRangeSchema,
    hours_per_week: z.object({
      current: timeRangeSchema,
      redesigned: timeRangeSchema,
      automated: timeRangeSchema,
    }),
    redesign_share_percent: timeRangeSchema,
    assumptions: z.array(z.string()),
    caveat: z.string().min(1),
  }),
  bottlenecks: z
    .array(
      z.object({
        title: z.string().min(1),
        why_it_matters: z.string().min(1),
        step_ids: z.array(z.string()),
        bridge_letter: bridgeLetterSchema,
      })
    )
    .max(5),
  quick_wins: z
    .array(
      z.object({
        action: z.string().min(1),
        step_ids: z.array(z.string()),
        needs_new_software: z.boolean(),
        time_to_do: z.enum(['under 1 hour', 'half a day', 'one week']),
      })
    )
    .max(6),
  automation_opportunities: z
    .array(
      z.object({
        name: z.string().min(1),
        effort: z.enum(['low', 'medium', 'high']),
        impact: z.enum(['low', 'medium', 'high']),
        step_ids: z.array(z.string()),
        verdict: z.enum(['worth_it_now', 'worth_it_later']).optional(),
        why_this_volume: z.string().optional(),
        revisit_when: z.string().nullable().optional(),
      })
    )
    .max(6),
  implementation_order: z
    .array(
      z.object({
        week: z.number().int().min(1).max(4),
        focus: z.string().min(1),
        actions: z.array(z.string()),
        includes_baseline: z.boolean().optional(),
      })
    )
    .length(4),
  readiness: z.object({
    score_percent: z.number().int().min(0).max(100),
    band: z.enum(['Fragile', 'Developing', 'Ready to scale']),
  }),
  crm_tags: z.object({
    industry: z.string(),
    process_code: z.string(),
    readiness_band: z.string(),
    top_bottleneck_bridge_letter: z.string(),
    volume_band: z.string(),
  }),
  cta: z.string().min(1),
});

export interface ValidationOutcome {
  valid: boolean;
  data?: ClarityMapResult;
  errors: string[];
}

export interface ValidateAnalysisOptions {
  volumeContext?: VolumeContext;
  strictV2?: boolean;
}

const LEAK_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: 'step id', regex: /\b[cra]\d{1,2}\b/g },
  { label: 'question id', regex: /\b[A-Z]{2}\d{2}_Q\d+\b/g },
  { label: 'common question id', regex: /\bC\d{1,2}b?\b/g },
  { label: 'snake_case token', regex: /\b[a-z]+(_[a-z]+)+\b/g },
];

export function findReaderFacingLeaks(text: string): Array<{ label: string; match: string }> {
  const hits: Array<{ label: string; match: string }> = [];
  if (!text) return hits;

  for (const { label, regex } of LEAK_PATTERNS) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      hits.push({ label, match: m[0] });
    }
  }
  return hits;
}

function getEffectiveEdges(node: { next: string[]; edges?: WorkflowEdge[] }): WorkflowEdge[] {
  if (Array.isArray(node.edges)) {
    return node.edges;
  }
  return node.next.map((to) => ({ to, label: '' }));
}

function validateStageGraph(
  stageName: string,
  nodes: Array<{ id: string; type: string; next: string[]; edges?: WorkflowEdge[] }>,
  requireV2Branching: boolean,
  allowEmptyStage: boolean,
  errors: string[]
): void {
  if (nodes.length === 0) {
    return;
  }

  const idSet = new Set(nodes.map((n) => n.id));
  if (idSet.size !== nodes.length) {
    errors.push(`Duplicate node IDs found in ${stageName}.nodes`);
  }

  for (const node of nodes) {
    for (const nextId of node.next) {
      if (!idSet.has(nextId)) {
        errors.push(`${stageName} node ${node.id} references invalid next node "${nextId}"`);
      }
    }

    if (Array.isArray(node.edges)) {
      for (const edge of node.edges) {
        if (!idSet.has(edge.to)) {
          errors.push(`${stageName} node ${node.id} edge references invalid node "${edge.to}"`);
        }
      }
    } else if (requireV2Branching) {
      errors.push(`${stageName} node ${node.id} is missing required "edges" array`);
    }

    if (requireV2Branching && node.type === 'decision') {
      const edges = getEffectiveEdges(node);
      if (edges.length < 2) {
        errors.push(
          `${stageName} decision node ${node.id} must have at least 2 outgoing edges`
        );
      }
      for (const edge of edges) {
        if (!edge.label || edge.label.trim() === '') {
          errors.push(
            `${stageName} decision node ${node.id} has an edge to "${edge.to}" with an empty label`
          );
        }
      }
    }
  }

  if (!requireV2Branching || allowEmptyStage) {
    return;
  }

  const endNodes = nodes.filter((n) => n.type === 'end');
  if (endNodes.length === 0) {
    errors.push(`${stageName} must include at least one node with type "end"`);
    return;
  }

  // Backward BFS from all "end" nodes over effective edges
  const reverseAdj = new Map<string, string[]>();
  nodes.forEach((n) => reverseAdj.set(n.id, []));

  for (const node of nodes) {
    const edges = getEffectiveEdges(node);
    const targets = edges.length > 0 ? edges.map((e) => e.to) : node.next;
    for (const target of targets) {
      if (idSet.has(target)) {
        reverseAdj.get(target)?.push(node.id);
      }
    }
  }

  const canReachEnd = new Set<string>();
  const queue: string[] = endNodes.map((n) => n.id);
  queue.forEach((id) => canReachEnd.add(id));

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    for (const prev of reverseAdj.get(curr) ?? []) {
      if (!canReachEnd.has(prev)) {
        canReachEnd.add(prev);
        queue.push(prev);
      }
    }
  }

  for (const node of nodes) {
    if (!canReachEnd.has(node.id)) {
      errors.push(
        `${stageName} node ${node.id} is a dead end or trapped cycle that cannot reach an "end" node`
      );
    }
  }
}

function collectReaderFacingFields(data: ClarityMapResult): Array<{ path: string; value: string }> {
  const fields: Array<{ path: string; value: string }> = [
    { path: 'summary.headline', value: data.summary.headline },
    { path: 'summary.paragraph', value: data.summary.paragraph },
    { path: 'time_estimate.caveat', value: data.time_estimate.caveat },
    { path: 'cta', value: data.cta },
  ];

  data.current_state.visibility_gaps.forEach((v, idx) =>
    fields.push({ path: `current_state.visibility_gaps[${idx}]`, value: v })
  );

  data.current_state.nodes.forEach((n, idx) => {
    fields.push({ path: `current_state.nodes[${idx}].label`, value: n.label });
    fields.push({ path: `current_state.nodes[${idx}].actor`, value: n.actor });
    fields.push({ path: `current_state.nodes[${idx}].tool`, value: n.tool });
    n.edges?.forEach((e, eIdx) => {
      fields.push({ path: `current_state.nodes[${idx}].edges[${eIdx}].label`, value: e.label });
    });
  });

  (['B', 'R', 'I', 'D', 'G', 'E'] as const).forEach((letter) => {
    fields.push({ path: `bridge_diagnosis.${letter}.finding`, value: data.bridge_diagnosis[letter].finding });
  });

  data.redesigned_state.nodes.forEach((n, idx) => {
    fields.push({ path: `redesigned_state.nodes[${idx}].label`, value: n.label });
    fields.push({ path: `redesigned_state.nodes[${idx}].actor`, value: n.actor });
    fields.push({ path: `redesigned_state.nodes[${idx}].tool`, value: n.tool });
    fields.push({ path: `redesigned_state.nodes[${idx}].rationale`, value: n.rationale });
    n.edges?.forEach((e, eIdx) => {
      fields.push({ path: `redesigned_state.nodes[${idx}].edges[${eIdx}].label`, value: e.label });
    });
  });

  data.redesigned_state.removed.forEach((rem, idx) => {
    fields.push({ path: `redesigned_state.removed[${idx}].reason`, value: rem.reason });
  });

  data.redesigned_state.rules_introduced.forEach((rule, idx) => {
    fields.push({ path: `redesigned_state.rules_introduced[${idx}]`, value: rule });
  });

  if (data.automated_state.reason) {
    fields.push({ path: 'automated_state.reason', value: data.automated_state.reason });
  }
  if (data.automated_state.revisit_when) {
    fields.push({ path: 'automated_state.revisit_when', value: data.automated_state.revisit_when });
  }

  data.automated_state.nodes.forEach((n, idx) => {
    fields.push({ path: `automated_state.nodes[${idx}].label`, value: n.label });
    fields.push({ path: `automated_state.nodes[${idx}].actor`, value: n.actor });
    fields.push({ path: `automated_state.nodes[${idx}].tool`, value: n.tool });
    fields.push({ path: `automated_state.nodes[${idx}].automation.description`, value: n.automation.description });
    if (n.automation.function) fields.push({ path: `automated_state.nodes[${idx}].automation.function`, value: n.automation.function });
    if (n.automation.trigger) fields.push({ path: `automated_state.nodes[${idx}].automation.trigger`, value: n.automation.trigger });
    if (n.automation.input) fields.push({ path: `automated_state.nodes[${idx}].automation.input`, value: n.automation.input });
    if (n.automation.action) fields.push({ path: `automated_state.nodes[${idx}].automation.action`, value: n.automation.action });
    if (n.automation.exception_route) fields.push({ path: `automated_state.nodes[${idx}].automation.exception_route`, value: n.automation.exception_route });
    if (n.automation.owner) fields.push({ path: `automated_state.nodes[${idx}].automation.owner`, value: n.automation.owner });
    fields.push({ path: `automated_state.nodes[${idx}].automation.human_checkpoint`, value: n.automation.human_checkpoint });
    n.edges?.forEach((e, eIdx) => {
      fields.push({ path: `automated_state.nodes[${idx}].edges[${eIdx}].label`, value: e.label });
    });
  });

  data.automated_state.not_automated.forEach((na, idx) => {
    fields.push({ path: `automated_state.not_automated[${idx}].reason`, value: na.reason });
  });

  data.time_estimate.assumptions.forEach((a, idx) => {
    fields.push({ path: `time_estimate.assumptions[${idx}]`, value: a });
  });

  data.bottlenecks.forEach((b, idx) => {
    fields.push({ path: `bottlenecks[${idx}].title`, value: b.title });
    fields.push({ path: `bottlenecks[${idx}].why_it_matters`, value: b.why_it_matters });
  });

  data.quick_wins.forEach((q, idx) => {
    fields.push({ path: `quick_wins[${idx}].action`, value: q.action });
  });

  data.automation_opportunities.forEach((o, idx) => {
    fields.push({ path: `automation_opportunities[${idx}].name`, value: o.name });
    if (o.why_this_volume) {
      fields.push({ path: `automation_opportunities[${idx}].why_this_volume`, value: o.why_this_volume });
    }
    if (o.revisit_when) {
      fields.push({ path: `automation_opportunities[${idx}].revisit_when`, value: o.revisit_when });
    }
  });

  data.implementation_order.forEach((wk, idx) => {
    fields.push({ path: `implementation_order[${idx}].focus`, value: wk.focus });
    wk.actions.forEach((act, aIdx) => {
      fields.push({ path: `implementation_order[${idx}].actions[${aIdx}]`, value: act });
    });
  });

  return fields;
}

export function computeReadiness(bridge: BridgeDiagnosis): {
  score_percent: number;
  band: 'Fragile' | 'Developing' | 'Ready to scale';
} {
  const total =
    bridge.B.score +
    bridge.R.score +
    bridge.I.score +
    bridge.D.score +
    bridge.G.score +
    bridge.E.score;
  const score_percent = Math.round((total / 24) * 100);
  const band =
    score_percent <= 33
      ? 'Fragile'
      : score_percent <= 66
      ? 'Developing'
      : 'Ready to scale';
  return { score_percent, band };
}

export function computeRedesignShare(time: TimeEstimate): { min: number | null; max: number | null } {
  const cMin = time.hours_per_week.current.min;
  const cMax = time.hours_per_week.current.max;
  const rMin = time.hours_per_week.redesigned.min;
  const rMax = time.hours_per_week.redesigned.max;
  const aMin = time.hours_per_week.automated.min;
  const aMax = time.hours_per_week.automated.max;

  if (
    cMin === null || cMax === null ||
    rMin === null || rMax === null ||
    aMin === null || aMax === null
  ) {
    return { min: null, max: null };
  }

  const totalSavingMin = cMin - aMin;
  const totalSavingMax = cMax - aMax;

  if (totalSavingMin <= 0 && totalSavingMax <= 0) {
    return { min: null, max: null };
  }

  const shareAtMin =
    totalSavingMin > 0 ? Math.max(0, Math.min(100, Math.round(((cMin - rMin) / totalSavingMin) * 100))) : 0;
  const shareAtMax =
    totalSavingMax > 0 ? Math.max(0, Math.min(100, Math.round(((cMax - rMax) / totalSavingMax) * 100))) : 0;

  return {
    min: Math.min(shareAtMin, shareAtMax),
    max: Math.max(shareAtMin, shareAtMax),
  };
}

/**
 * Strict structural + semantic validator for Gemini output (supports v1 & v2).
 */
export function validateClarityMapAnalysis(
  raw: unknown,
  options?: ValidateAnalysisOptions
): ValidationOutcome {
  const parsed = clarityMapResultSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    };
  }

  const data = parsed.data as ClarityMapResult;
  const isV2 = Boolean(options?.strictV2) || data.schema_version === 2;
  const errors: string[] = [];

  if (options?.strictV2 && data.schema_version !== 2) {
    errors.push('schema_version must be 2');
  }

  const currentIds = new Set(data.current_state.nodes.map((n) => n.id));
  const redesignedIds = new Set(data.redesigned_state.nodes.map((n) => n.id));
  const automatedIds = new Set(data.automated_state.nodes.map((n) => n.id));

  // Graph connectivity & v2 branching/end checks
  validateStageGraph('current_state', data.current_state.nodes, isV2, false, errors);
  validateStageGraph('redesigned_state', data.redesigned_state.nodes, isV2, false, errors);

  const stage3NotYet = data.automated_state.status === 'not_yet';
  validateStageGraph(
    'automated_state',
    data.automated_state.nodes,
    isV2,
    stage3NotYet || data.automated_state.nodes.length === 0,
    errors
  );

  // Stage 1: empty evidence implies inferred=true; time sanity
  for (const node of data.current_state.nodes) {
    if (node.evidence.length === 0 && !node.inferred) {
      node.inferred = true;
    }
    if (node.time_min !== null && node.time_max !== null && node.time_min > node.time_max) {
      errors.push(`current_state node ${node.id} has time_min > time_max`);
    }
  }

  // Stage 2: removed check, replaces references, step count <= Stage 1 + 1
  for (const node of data.redesigned_state.nodes) {
    if (node.change_type === 'removed') {
      errors.push(
        `redesigned_state.nodes contains node ${node.id} with change_type="removed"; removed steps must live in redesigned_state.removed`
      );
    }
    for (const repId of node.replaces) {
      if (!currentIds.has(repId)) {
        errors.push(`redesigned_state node ${node.id} replaces non-existent current node "${repId}"`);
      }
    }
    if (node.time_min !== null && node.time_max !== null && node.time_min > node.time_max) {
      errors.push(`redesigned_state node ${node.id} has time_min > time_max`);
    }
  }

  if (isV2 && data.current_state.nodes.length > 0) {
    const currentOperational = data.current_state.nodes.filter((n) => n.type !== 'end').length;
    const redesignedOperational = data.redesigned_state.nodes.filter((n) => n.type !== 'end').length;
    if (redesignedOperational > currentOperational + 1) {
      errors.push(
        `redesigned_state has ${redesignedOperational} operational steps, exceeding Stage 1 (${currentOperational}) plus 1`
      );
    }
  }

  for (const rem of data.redesigned_state.removed) {
    for (const repId of rem.replaces) {
      if (!currentIds.has(repId)) {
        errors.push(`redesigned_state.removed references non-existent current node "${repId}"`);
      }
    }
  }

  // Stage 3: automated checks + AI limits + structured v2 fields
  let assistedAiCount = 0;
  const automatedOperationalNodes = data.automated_state.nodes.filter((n) => n.type !== 'end');

  for (const node of data.automated_state.nodes) {
    for (const fromId of node.from) {
      if (!redesignedIds.has(fromId)) {
        errors.push(`automated_state node ${node.id} references non-existent redesigned node "${fromId}"`);
      }
    }
    if (/\bAI\b/.test(node.label)) {
      errors.push(
        `automated_state node ${node.id} label "${node.label}" violates rule: do not use the word "AI" in node labels`
      );
    }
    if (node.type !== 'end' && node.automation.type === 'assisted_by_ai') {
      assistedAiCount += 1;
    }
    if (node.time_min !== null && node.time_max !== null && node.time_min > node.time_max) {
      errors.push(`automated_state node ${node.id} has time_min > time_max`);
    }

    if (isV2 && node.type !== 'end') {
      const requiredStructured = [
        'function',
        'trigger',
        'input',
        'action',
        'exception_route',
        'owner',
      ] as const;
      for (const field of requiredStructured) {
        const val = node.automation[field];
        if (!val || val.trim() === '') {
          errors.push(`automated_state node ${node.id} automation.${field} must be non-empty in v2`);
        }
      }
    }
  }

  if (assistedAiCount > 2) {
    errors.push(`automated_state uses assisted_by_ai ${assistedAiCount} times; maximum allowed is 2`);
  }

  if (isV2 && data.automated_state.status === 'not_yet') {
    if (data.automated_state.nodes.length > 0) {
      errors.push('automated_state.nodes must be empty when automated_state.status is "not_yet"');
    }
    if (!data.automated_state.revisit_when || data.automated_state.revisit_when.trim() === '') {
      errors.push('automated_state.revisit_when must be non-empty when automated_state.status is "not_yet"');
    }
  }

  // Volume gate checks (Rule 5)
  const volumeBand = options?.volumeContext?.volume_band;
  if (isV2 && volumeBand) {
    if (volumeBand === 'low' || volumeBand === 'unknown') {
      if (automatedOperationalNodes.length > 2) {
        errors.push(
          `At "${volumeBand}" volume, automated_state may have at most 2 automated steps (got ${automatedOperationalNodes.length})`
        );
      }
      for (const node of automatedOperationalNodes) {
        if (!LOW_VOLUME_ALLOWED_AUTOMATION_TYPES.has(node.automation.type)) {
          errors.push(
            `At "${volumeBand}" volume, automation type "${node.automation.type}" on ${node.id} is not permitted`
          );
        }
      }
      if (data.automated_state.status === 'recommended') {
        errors.push(
          `At "${volumeBand}" volume, automated_state.status must be "limited" or "not_yet", not "recommended"`
        );
      }
      for (const opp of data.automation_opportunities) {
        if (opp.impact === 'high') {
          errors.push(
            `At "${volumeBand}" volume, automation opportunity "${opp.name}" cannot rate impact as "high" (maximum is "medium")`
          );
        }
      }
    } else if (volumeBand === 'medium') {
      if (automatedOperationalNodes.length > 3) {
        errors.push(
          `At "medium" volume, automated_state may have at most 3 automated steps (got ${automatedOperationalNodes.length})`
        );
      }
    } else if (volumeBand === 'high') {
      if (automatedOperationalNodes.length > 5) {
        errors.push(
          `At "high" volume, automated_state may have at most 5 automated steps (got ${automatedOperationalNodes.length})`
        );
      }
    }
  }

  if (isV2) {
    for (const opp of data.automation_opportunities) {
      if (!opp.verdict) {
        errors.push(`automation_opportunities item "${opp.name}" is missing verdict`);
      }
      if (!opp.why_this_volume || opp.why_this_volume.trim() === '') {
        errors.push(`automation_opportunities item "${opp.name}" is missing why_this_volume`);
      }
      if (opp.verdict === 'worth_it_later' && (!opp.revisit_when || opp.revisit_when.trim() === '')) {
        errors.push(`automation_opportunities item "${opp.name}" requires revisit_when when verdict is "worth_it_later"`);
      }
    }
  }

  for (const item of data.automated_state.not_automated) {
    if (!redesignedIds.has(item.step)) {
      errors.push(`automated_state.not_automated references non-existent redesigned node "${item.step}"`);
    }
  }

  // Bottlenecks must cite valid current nodes
  if (data.current_state.nodes.length > 0) {
    if (data.bottlenecks.length !== 3) {
      errors.push(`Expected exactly 3 bottlenecks, received ${data.bottlenecks.length}`);
    }
    for (const b of data.bottlenecks) {
      for (const sid of b.step_ids) {
        if (!currentIds.has(sid)) {
          errors.push(`Bottleneck "${b.title}" references invalid current step_id "${sid}"`);
        }
      }
    }
  }

  // Implementation weeks 1..4 + Week 1 baseline rule (v2)
  const weeks = new Set(data.implementation_order.map((w) => w.week));
  if (weeks.size !== 4 || ![1, 2, 3, 4].every((w) => weeks.has(w))) {
    errors.push('implementation_order must include weeks 1, 2, 3, and 4');
  }

  if (isV2 && data.implementation_order.length === 4) {
    const sorted = [...data.implementation_order].sort((a, b) => a.week - b.week);
    const week1 = sorted[0];
    if (week1.includes_baseline !== true) {
      errors.push('implementation_order[0].includes_baseline must be true in v2');
    }
    const week1Text = `${week1.focus} ${week1.actions.join(' ')}`;
    if (!/\b(time|measure|baseline|track|record|runs?)\b/i.test(week1Text)) {
      errors.push('Week 1 must include a concrete timing/baseline measurement action');
    }

    for (const laterWeek of sorted.slice(1)) {
      for (const action of laterWeek.actions) {
        const introducesBaseline =
          /\b(establish|create|start|set|record|measure)\b[^.]{0,40}\bbaseline\b/i.test(action) ||
          /\btime each step across\b/i.test(action);
        const isComparison = /\b(compare|versus|vs\.?|against|week 1)\b/i.test(action);
        if (introducesBaseline && !isComparison) {
          errors.push(
            `Week ${laterWeek.week} introduces a first-time baseline ("${action}"); baseline measurement belongs in Week 1`
          );
        }
      }
    }
  }

  // Reader-facing leak regex checks (v2)
  if (isV2) {
    for (const field of collectReaderFacingFields(data)) {
      const leaks = findReaderFacingLeaks(field.value);
      if (leaks.length > 0) {
        const preview = leaks.map((l) => `${l.label} "${l.match}"`).slice(0, 3).join(', ');
        errors.push(`Reader-facing field ${field.path} contains internal token(s): ${preview}`);
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Enforce deterministic math
  const deterministicReadiness = computeReadiness(data.bridge_diagnosis);
  data.readiness = deterministicReadiness;
  data.crm_tags.readiness_band = deterministicReadiness.band;

  if (data.automated_state.status === 'not_yet') {
    data.time_estimate.hours_per_week.automated = {
      ...data.time_estimate.hours_per_week.redesigned,
    };
  }

  data.time_estimate.redesign_share_percent = computeRedesignShare(data.time_estimate);
  data.cta = 'Want this checked against how your business really runs? Book a 30-minute Systems Clarity Audit.';

  return { valid: true, data, errors: [] };
}
