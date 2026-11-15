import type {
  AutomationType,
  BridgeLetter,
  ChangeType,
  ClarityMapResult,
  PainFlag,
  WorkflowEdge,
  WorkflowNodeType,
} from '../types/clarityMap';

export interface LayoutNodeInput {
  id: string;
  type?: WorkflowNodeType;
  next: string[];
  edges?: WorkflowEdge[];
}

export interface LayoutConfig {
  nodeW: number;
  nodeH: number;
  endW: number;
  endH: number;
  colGap: number;
  rowGap: number;
  padX: number;
  padY: number;
  startW: number;
  startH: number;
  startGap: number;
}

export const DEFAULT_WEB_LAYOUT_CONFIG: LayoutConfig = {
  nodeW: 228,
  nodeH: 120,
  endW: 136,
  endH: 44,
  colGap: 48,
  rowGap: 54,
  padX: 40,
  padY: 20,
  startW: 108,
  startH: 32,
  startGap: 32,
};

export const PDF_LAYOUT_CONFIG: LayoutConfig = {
  nodeW: 158,
  nodeH: 60,
  endW: 96,
  endH: 26,
  colGap: 18,
  rowGap: 26,
  padX: 14,
  padY: 8,
  startW: 84,
  startH: 22,
  startGap: 18,
};

export interface PositionedNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rank: number;
  lane: number;
  stepNumber: number | null;
}

export interface EdgePath {
  fromId: string;
  toId: string;
  label: string;
  pathD: string;
  labelX: number;
  labelY: number;
  isBackEdge: boolean;
  points: Array<[number, number]>;
}

export interface StartMarker {
  x: number;
  y: number;
  width: number;
  height: number;
  targetIds: string[];
}

export interface GraphLayout {
  positions: Record<string, PositionedNode>;
  edges: EdgePath[];
  startMarker: StartMarker | null;
  stepNumbers: Record<string, number>;
  orderedNodeIds: string[];
  width: number;
  height: number;
}

export function getEffectiveNodeEdges(node: {
  next: string[];
  edges?: WorkflowEdge[];
}): WorkflowEdge[] {
  if (Array.isArray(node.edges) && node.edges.length > 0) {
    return node.edges;
  }
  if (Array.isArray(node.edges) && node.edges.length === 0 && node.next.length === 0) {
    return [];
  }
  return (node.next || []).map((to) => ({ to, label: '' }));
}

/**
 * Computes a layered, top-to-bottom workflow diagram layout with centered main spine,
 * labeled decision branches, Start marker, End markers, and clean side-routed back edges.
 * Shared by both React on-screen diagrams and server PDFKit vector rendering.
 */
export function computeWorkflowLayout(
  nodes: LayoutNodeInput[],
  config: LayoutConfig = DEFAULT_WEB_LAYOUT_CONFIG
): GraphLayout {
  if (nodes.length === 0) {
    return {
      positions: {},
      edges: [],
      startMarker: null,
      stepNumbers: {},
      orderedNodeIds: [],
      width: 480,
      height: 160,
    };
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const nodeIds = nodes.map((n) => n.id);
  const validSet = new Set(nodeIds);

  // Build adjacency & detect back-edges via DFS from roots
  const inDegree: Record<string, number> = {};
  nodeIds.forEach((id) => {
    inDegree[id] = 0;
  });

  const rawOutEdges = new Map<string, WorkflowEdge[]>();
  nodes.forEach((n) => {
    const validEdges = getEffectiveNodeEdges(n).filter(
      (e) => validSet.has(e.to) && e.to !== n.id
    );
    rawOutEdges.set(n.id, validEdges);
    validEdges.forEach((e) => {
      inDegree[e.to] = (inDegree[e.to] || 0) + 1;
    });
  });

  const roots = nodeIds.filter((id) => inDegree[id] === 0);
  const effectiveRoots = roots.length > 0 ? roots : [nodeIds[0]];

  const visited = new Set<string>();
  const visiting = new Set<string>();
  const backEdgeKeys = new Set<string>();
  const dfsOrder: string[] = [];

  function dfs(id: string) {
    visited.add(id);
    visiting.add(id);
    dfsOrder.push(id);

    for (const edge of rawOutEdges.get(id) ?? []) {
      if (visiting.has(edge.to)) {
        backEdgeKeys.add(`${id}->${edge.to}`);
      } else if (!visited.has(edge.to)) {
        dfs(edge.to);
      }
    }

    visiting.delete(id);
  }

  effectiveRoots.forEach((r) => {
    if (!visited.has(r)) dfs(r);
  });
  nodeIds.forEach((id) => {
    if (!visited.has(id)) dfs(id);
  });

  // Compute DAG ranks (topological longest path ignoring back-edges)
  const rankMap: Record<string, number> = {};
  effectiveRoots.forEach((r) => {
    rankMap[r] = 0;
  });

  // Relax DAG edges up to nodes.length passes
  for (let pass = 0; pass < nodes.length; pass++) {
    let changed = false;
    for (const id of dfsOrder) {
      const baseRank = rankMap[id];
      if (baseRank === undefined) continue;
      for (const edge of rawOutEdges.get(id) ?? []) {
        if (backEdgeKeys.has(`${id}->${edge.to}`)) continue;
        const proposed = baseRank + 1;
        if (rankMap[edge.to] === undefined || proposed > rankMap[edge.to]) {
          rankMap[edge.to] = proposed;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  let fallbackRank = 0;
  nodeIds.forEach((id) => {
    if (rankMap[id] === undefined) {
      rankMap[id] = fallbackRank;
    }
    fallbackRank = Math.max(fallbackRank, rankMap[id] + 1);
  });

  // Push pure 'end' nodes to the bottom rank so exits align cleanly
  const maxOperationalRank = Math.max(
    0,
    ...nodeIds
      .filter((id) => nodeMap.get(id)?.type !== 'end')
      .map((id) => rankMap[id] ?? 0)
  );
  nodeIds.forEach((id) => {
    if (nodeMap.get(id)?.type === 'end') {
      rankMap[id] = Math.max(rankMap[id] ?? 0, maxOperationalRank + 1);
    }
  });

  // Compact ranks cleanly 0..R
  const distinctRanks = Array.from(new Set(Object.values(rankMap))).sort((a, b) => a - b);
  const rankRemap = new Map<number, number>();
  distinctRanks.forEach((r, idx) => rankRemap.set(r, idx));

  const dfsIndex = new Map(dfsOrder.map((id, idx) => [id, idx]));
  const rows: Record<number, string[]> = {};
  nodeIds.forEach((id) => {
    const r = rankRemap.get(rankMap[id]) ?? 0;
    rankMap[id] = r;
    if (!rows[r]) rows[r] = [];
    rows[r].push(id);
  });

  Object.values(rows).forEach((rowIds) => {
    rowIds.sort((a, b) => (dfsIndex.get(a) ?? 0) - (dfsIndex.get(b) ?? 0));
  });

  const sortedRanks = Object.keys(rows)
    .map(Number)
    .sort((a, b) => a - b);

  // Number non-end steps 1..N in top-to-bottom flow order
  const orderedNodeIds: string[] = [];
  const stepNumbers: Record<string, number> = {};
  let nextStepNumber = 1;
  sortedRanks.forEach((r) => {
    rows[r].forEach((id) => {
      orderedNodeIds.push(id);
      if (nodeMap.get(id)?.type !== 'end') {
        stepNumbers[id] = nextStepNumber++;
      }
    });
  });

  const getNodeDims = (id: string) => {
    const isEnd = nodeMap.get(id)?.type === 'end';
    return {
      width: isEnd ? config.endW : config.nodeW,
      height: isEnd ? config.endH : config.nodeH,
    };
  };

  // Determine widest row to establish central vertical spine
  const rowWidths = sortedRanks.map((r) => {
    const ids = rows[r];
    return (
      ids.reduce((sum, id) => sum + getNodeDims(id).width, 0) +
      Math.max(0, ids.length - 1) * config.colGap
    );
  });
  const maxRowW = Math.max(...rowWidths, config.startW);
  const hasBackEdges = backEdgeKeys.size > 0;
  const backEdgeGutter = hasBackEdges ? Math.max(36, Math.round(config.colGap * 0.85)) : 0;

  const canvasW = config.padX * 2 + maxRowW + backEdgeGutter;
  const spineCenterX = config.padX + maxRowW / 2;

  const startMarker: StartMarker = {
    x: spineCenterX - config.startW / 2,
    y: config.padY,
    width: config.startW,
    height: config.startH,
    targetIds: effectiveRoots,
  };

  const positions: Record<string, PositionedNode> = {};
  let currentY = config.padY + config.startH + config.startGap;

  sortedRanks.forEach((rank, idx) => {
    const rowIds = rows[rank];
    const totalRowWidth =
      rowIds.reduce((sum, id) => sum + getNodeDims(id).width, 0) +
      Math.max(0, rowIds.length - 1) * config.colGap;
    let cursorX = spineCenterX - totalRowWidth / 2;
    let rowMaxH = 0;

    rowIds.forEach((id, lane) => {
      const dims = getNodeDims(id);
      positions[id] = {
        id,
        x: cursorX,
        y: currentY,
        width: dims.width,
        height: dims.height,
        rank,
        lane,
        stepNumber: stepNumbers[id] ?? null,
      };
      cursorX += dims.width + config.colGap;
      rowMaxH = Math.max(rowMaxH, dims.height);
    });

    if (idx < sortedRanks.length - 1) {
      currentY += rowMaxH + config.rowGap;
    } else {
      currentY += rowMaxH;
    }
  });

  const canvasH = currentY + config.padY;

  // Compute directed top-to-bottom SVG + polyline edge coordinates
  const edges: EdgePath[] = [];
  const rightMostNodeX = Math.max(
    ...Object.values(positions).map((p) => p.x + p.width),
    spineCenterX + config.nodeW / 2
  );

  nodes.forEach((node) => {
    const from = positions[node.id];
    if (!from) return;

    const outgoing = rawOutEdges.get(node.id) ?? [];
    const totalOut = outgoing.length;

    outgoing.forEach((edge, outIdx) => {
      const to = positions[edge.to];
      if (!to) return;

      const isBack = backEdgeKeys.has(`${node.id}->${edge.to}`) || to.rank <= from.rank;
      if (!isBack) {
        // Spread departure X slightly if multiple branches leave one node
        const spreadOffset =
          totalOut > 1 ? ((outIdx / (totalOut - 1)) - 0.5) * Math.min(48, from.width * 0.36) : 0;
        const startX = from.x + from.width / 2 + spreadOffset;
        const startY = from.y + from.height;
        const endX = to.x + to.width / 2;
        const endY = to.y;
        const midY = startY + (endY - startY) * 0.5;

        // If spanning multiple ranks vertically along nearly the same X, bow gently outward to avoid hitting intermediate boxes
        const spansMultipleRanks = to.rank - from.rank > 1;
        const alignedVertically = Math.abs(startX - endX) < 12;
        let pathD: string;
        let points: Array<[number, number]>;
        let labelX: number;
        let labelY: number;

        if (spansMultipleRanks && alignedVertically) {
          const sideSign = from.lane === 0 ? -1 : 1;
          const detourX = startX + sideSign * (from.width * 0.58 + 18);
          pathD = `M ${startX} ${startY} C ${detourX} ${startY + 22}, ${detourX} ${endY - 22}, ${endX} ${endY - 4}`;
          points = [
            [startX, startY],
            [detourX, startY + 24],
            [detourX, endY - 24],
            [endX, endY - 4],
          ];
          labelX = detourX;
          labelY = (startY + endY) / 2;
        } else {
          pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY - 4}`;
          points = [
            [startX, startY],
            [startX, midY],
            [endX, midY],
            [endX, endY - 4],
          ];
          // Place branch label toward the destination branch side so sibling branch labels never collide
          labelX = startX + (endX - startX) * 0.62;
          labelY = startY + (endY - startY) * 0.44;
        }

        edges.push({
          fromId: node.id,
          toId: edge.to,
          label: (edge.label || '').trim(),
          pathD,
          labelX,
          labelY,
          isBackEdge: false,
          points,
        });
      } else {
        const startX = from.x + from.width;
        const startY = from.y + from.height / 2;
        const endX = to.x + to.width;
        const endY = to.y + to.height / 2;
        const gutterX = rightMostNodeX + Math.max(22, Math.round(backEdgeGutter * 0.62));
        const pathD = `M ${startX} ${startY} C ${gutterX} ${startY}, ${gutterX} ${endY}, ${endX + 4} ${endY}`;
        edges.push({
          fromId: node.id,
          toId: edge.to,
          label: (edge.label || '').trim(),
          pathD,
          labelX: gutterX - 8,
          labelY: (startY + endY) / 2,
          isBackEdge: true,
          points: [
            [startX, startY],
            [gutterX, startY],
            [gutterX, endY],
            [endX + 4, endY],
          ],
        });
      }
    });
  });

  return {
    positions,
    edges,
    startMarker,
    stepNumbers,
    orderedNodeIds,
    width: canvasW,
    height: canvasH,
  };
}

export function formatMinutesRange(min: number | null, max: number | null): string | null {
  if (min === null || max === null) return null;
  return min === max ? `${min} min` : `${min}–${max} min`;
}

export function formatHoursRange(min: number | null, max: number | null, unit = 'hrs/wk'): string | null {
  if (min === null && max === null) return null;
  const suffix = unit ? ` ${unit}` : '';
  if (min !== null && max !== null) {
    return min === max ? `${min}${suffix}` : `${min}–${max}${suffix}`;
  }
  if (min !== null) return `${min}+${suffix}`;
  return `Up to ${max}${suffix}`;
}

export function countHandoffs(nodes: Array<{ type: WorkflowNodeType }>): number {
  return nodes.filter((n) => n.type === 'handoff').length;
}

export function countOperationalSteps(nodes: Array<{ type: WorkflowNodeType }>): number {
  return nodes.filter((n) => n.type !== 'end').length;
}

export function countStageManualSteps(
  result: ClarityMapResult,
  stage: 'current' | 'redesigned' | 'automated'
): number {
  if (stage === 'current') {
    return result.current_state.nodes.filter((n) => n.type !== 'wait' && n.type !== 'end').length;
  }
  if (stage === 'redesigned') {
    return result.redesigned_state.nodes.filter((n) => n.type !== 'wait' && n.type !== 'end').length;
  }
  return result.automated_state.not_automated.length;
}

export const BRIDGE_LENS_META: Record<
  BridgeLetter,
  { name: string; focus: string; description: string }
> = {
  B: {
    name: 'Baseline',
    focus: 'Visibility & repeatability',
    description: 'Whether steps are documented, repeatable, and understood the same way across the team.',
  },
  R: {
    name: 'Roles',
    focus: 'Ownership & handoffs',
    description: 'Clear single ownership at every step and clean transitions when work changes hands.',
  },
  I: {
    name: 'Integrate',
    focus: 'Connected tools',
    description: 'Reducing copy-pasting and re-typing between spreadsheets, inboxes, and operational apps.',
  },
  D: {
    name: 'Data',
    focus: 'Single source of truth',
    description: 'Reliable, searchable records and status visibility without asking people for updates.',
  },
  G: {
    name: 'Govern',
    focus: 'Rules, SLAs & checks',
    description: 'Clear escalation limits, approval thresholds, and exception checks before errors reach clients.',
  },
  E: {
    name: 'Evolve',
    focus: 'Review & improvement',
    description: 'Regular review cadence using operational numbers so bottlenecks get fixed permanently.',
  },
};

export const CHANGE_TYPE_META: Record<ChangeType, { label: string; tone: string }> = {
  removed: { label: 'Removed', tone: 'bg-red-50 text-red-800 border-red-200' },
  merged: { label: 'Merged', tone: 'bg-sage-soft text-sage-primary border-sage-primary/30' },
  reordered: { label: 'Reordered', tone: 'bg-sage-soft text-sage-primary border-sage-primary/30' },
  standardised: { label: 'Standardised', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  assigned: { label: 'Owner assigned', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  rule_added: { label: 'Rule added', tone: 'bg-blue-50 text-blue-800 border-blue-200' },
  step_added: { label: 'Step added', tone: 'bg-sage-surface-2 text-sage-text border-sage-border' },
  unchanged: { label: 'Kept as-is', tone: 'bg-sage-surface-2 text-sage-sec border-sage-border' },
};

export const AUTOMATION_TYPE_META: Record<AutomationType, { label: string }> = {
  capture_form: { label: 'Capture form' },
  auto_record: { label: 'Auto-record' },
  sync_between_systems: { label: 'System sync' },
  scheduled_reminder: { label: 'Scheduled reminder' },
  status_notification: { label: 'Status update' },
  template_generation: { label: 'Template draft' },
  rule_based_routing: { label: 'Rule routing' },
  approval_request: { label: 'Approval prompt' },
  payment_or_data_match: { label: 'Data / payment match' },
  dashboard_or_report: { label: 'Live report' },
  assisted_by_ai: { label: 'Smart assist (human-reviewed)' },
};

export const PAIN_FLAG_LABELS: Record<PainFlag, string> = {
  single_person_dependency: 'Depends on one person',
  re_entry: 'Information re-typed',
  waiting: 'Waiting time',
  no_owner: 'No clear owner',
  no_record: 'No written record',
  no_status: 'No visible status',
  rework_risk: 'Risk of rework',
  no_rule: 'No written rule',
  no_review: 'Never reviewed',
};

export function getPainFlagLabel(flag: string): string | null {
  const known = PAIN_FLAG_LABELS[flag as PainFlag];
  if (known) {
    return known;
  }
  console.warn(`[ClarityMap] Unknown pain_flag token "${flag}" ignored by renderer.`);
  return null;
}

export function resolvePainFlagLabels(flags: string[] | undefined): string[] {
  if (!Array.isArray(flags) || flags.length === 0) return [];
  const labels: string[] = [];
  for (const f of flags) {
    const label = getPainFlagLabel(f);
    if (label && !labels.includes(label)) {
      labels.push(label);
    }
  }
  return labels;
}
