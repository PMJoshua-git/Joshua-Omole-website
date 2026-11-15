import type {
  AutomatedStateStatus,
  ClarityMapResult,
  ClarityMapStage,
  CurrentStateNode,
  RedesignedStateNode,
  AutomatedStateNode,
} from '../types/clarityMap';
import {
  computeWorkflowLayout,
  DEFAULT_WEB_LAYOUT_CONFIG,
  formatHoursRange,
  formatMinutesRange,
  resolvePainFlagLabels,
  type LayoutConfig,
} from './diagramLayout';
import { resolveEvidenceLabels } from './questionRegistry';

export interface StageStepLookup {
  stepNumbers: Record<string, number>;
  labelById: Record<string, string>;
  orderedNodes: Array<CurrentStateNode | RedesignedStateNode | AutomatedStateNode>;
}

export function buildStageLookup<
  T extends CurrentStateNode | RedesignedStateNode | AutomatedStateNode,
>(nodes: T[], config: LayoutConfig = DEFAULT_WEB_LAYOUT_CONFIG): {
  stepNumbers: Record<string, number>;
  labelById: Record<string, string>;
  orderedNodes: T[];
  layout: ReturnType<typeof computeWorkflowLayout>;
} {
  const layout = computeWorkflowLayout(nodes, config);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const orderedNodes: T[] = [];
  for (const id of layout.orderedNodeIds) {
    const node = byId.get(id);
    if (node) orderedNodes.push(node);
  }
  const labelById: Record<string, string> = {};
  nodes.forEach((n) => {
    labelById[n.id] = n.label;
  });

  return {
    stepNumbers: layout.stepNumbers,
    labelById,
    orderedNodes,
    layout,
  };
}

export function normalizeCurrentNodesForRender(nodes: CurrentStateNode[]): CurrentStateNode[] {
  return nodes.map((n) => ({
    ...n,
    inferred: Boolean(n.inferred || !Array.isArray(n.evidence) || n.evidence.length === 0),
    edges:
      Array.isArray(n.edges) && n.edges.length > 0
        ? n.edges
        : (n.next || []).map((to) => ({ to, label: '' })),
  }));
}

export function getAutomatedStageStatus(result: ClarityMapResult): AutomatedStateStatus {
  if (result.automated_state.status) {
    return result.automated_state.status;
  }
  return result.automated_state.nodes.length === 0 ? 'not_yet' : 'recommended';
}

/**
 * Formats node id references as plain-language 1-based step numbers (e.g. "Step 2" or "Steps 2, 4, 5").
 * Never leaks raw node IDs like "c2" or "r4".
 */
export function formatStepReferences(
  ids: string[] | undefined,
  stepNumbers: Record<string, number>,
  options?: { fallbackText?: string; capitalize?: boolean }
): string {
  const nums = (ids || [])
    .map((id) => stepNumbers[id])
    .filter((num): num is number => typeof num === 'number');

  const uniqueSorted = Array.from(new Set(nums)).sort((a, b) => a - b);
  if (uniqueSorted.length === 0) {
    return options?.fallbackText ?? 'Process-wide';
  }
  const prefix =
    uniqueSorted.length === 1
      ? options?.capitalize === false
        ? 'step'
        : 'Step'
      : options?.capitalize === false
      ? 'steps'
      : 'Steps';
  return `${prefix} ${uniqueSorted.join(', ')}`;
}

export function formatReplacesTodayText(
  replacesIds: string[] | undefined,
  currentStepNumbers: Record<string, number>
): string {
  const nums = (replacesIds || [])
    .map((id) => currentStepNumbers[id])
    .filter((num): num is number => typeof num === 'number');

  const uniqueSorted = Array.from(new Set(nums)).sort((a, b) => a - b);
  if (uniqueSorted.length === 0) {
    return 'New control step';
  }
  if (uniqueSorted.length === 1) {
    return `Replaces step ${uniqueSorted[0]} (Today)`;
  }
  return `Replaces steps ${uniqueSorted.join(', ')} (Today)`;
}

export function formatNotAutomatedStepTitle(
  stepId: string,
  redesignedStepNumbers: Record<string, number>,
  redesignedNodes: RedesignedStateNode[]
): string {
  const stepNum = redesignedStepNumbers[stepId];
  const nodeLabel = redesignedNodes.find((n) => n.id === stepId)?.label;
  if (typeof stepNum === 'number' && nodeLabel) {
    return `Step ${stepNum} (${nodeLabel})`;
  }
  if (typeof stepNum === 'number') {
    return `Step ${stepNum}`;
  }
  if (nodeLabel) {
    return nodeLabel;
  }
  return 'Manual workflow step';
}

export function hasAnyTimeData(result: ClarityMapResult): boolean {
  const t = result.time_estimate;
  const ranges = [
    t.runs_per_week,
    t.hours_per_week.current,
    t.hours_per_week.redesigned,
    t.hours_per_week.automated,
  ];
  return ranges.some((r) => r.min !== null || r.max !== null);
}

export function collectStageEvidenceSummary(
  result: ClarityMapResult,
  stage: ClarityMapStage
): string[] {
  const qids: string[] = [];

  if (stage === 'current') {
    result.current_state.nodes.forEach((n) => qids.push(...(n.evidence || [])));
  } else if (stage === 'redesigned') {
    const currentById = new Map(result.current_state.nodes.map((n) => [n.id, n]));
    result.redesigned_state.nodes.forEach((rn) => {
      rn.replaces.forEach((cid) => {
        const cn = currentById.get(cid);
        if (cn) qids.push(...(cn.evidence || []));
      });
    });
  } else {
    const currentById = new Map(result.current_state.nodes.map((n) => [n.id, n]));
    const redesignedById = new Map(result.redesigned_state.nodes.map((n) => [n.id, n]));
    result.automated_state.nodes.forEach((an) => {
      an.from.forEach((rid) => {
        const rn = redesignedById.get(rid);
        rn?.replaces.forEach((cid) => {
          const cn = currentById.get(cid);
          if (cn) qids.push(...(cn.evidence || []));
        });
      });
    });
  }

  return resolveEvidenceLabels(qids);
}

export function stageHasInferredNodes(
  result: ClarityMapResult,
  stage: ClarityMapStage
): boolean {
  if (stage !== 'current') return false;
  return normalizeCurrentNodesForRender(result.current_state.nodes).some((n) => n.inferred);
}

export function stageHasPainFlags(
  result: ClarityMapResult,
  stage: ClarityMapStage
): boolean {
  if (stage !== 'current') return false;
  return result.current_state.nodes.some((n) => resolvePainFlagLabels(n.pain_flags).length > 0);
}

export function getOptionalNodeTimeLabel(
  timeMin: number | null,
  timeMax: number | null
): string | null {
  return formatMinutesRange(timeMin, timeMax);
}

export function getOptionalHoursLabel(
  min: number | null,
  max: number | null,
  unit = 'hrs/wk'
): string | null {
  return formatHoursRange(min, max, unit);
}
