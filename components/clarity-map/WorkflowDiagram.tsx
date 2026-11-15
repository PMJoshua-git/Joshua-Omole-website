import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRightLeft,
  Clock,
  Flag,
  GitFork,
  List,
  Maximize2,
  Network,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  AUTOMATION_TYPE_META,
  CHANGE_TYPE_META,
  computeWorkflowLayout,
  DEFAULT_WEB_LAYOUT_CONFIG,
  resolvePainFlagLabels,
} from '../../features/clarity-map/utils/diagramLayout';
import {
  getOptionalNodeTimeLabel,
  normalizeCurrentNodesForRender,
} from '../../features/clarity-map/utils/clarityMapPresenter';
import type {
  AutomatedStateNode,
  ClarityMapStage,
  CurrentStateNode,
  RedesignedStateNode,
} from '../../features/clarity-map/types/clarityMap';

type AnyWorkflowNode = CurrentStateNode | RedesignedStateNode | AutomatedStateNode;

interface WorkflowDiagramProps {
  stage: ClarityMapStage;
  nodes: AnyWorkflowNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  compact?: boolean;
}

const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({
  stage,
  nodes,
  selectedNodeId,
  onSelectNode,
  compact = false,
}) => {
  const [zoom, setZoom] = useState(compact ? 0.78 : 0.92);
  const [viewMode, setViewMode] = useState<'diagram' | 'list'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'diagram'
  );
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOrigin = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);

  const normalizedNodes = useMemo(
    () =>
      stage === 'current'
        ? (normalizeCurrentNodesForRender(nodes as CurrentStateNode[]) as AnyWorkflowNode[])
        : nodes,
    [stage, nodes]
  );

  const layout = useMemo(
    () => computeWorkflowLayout(normalizedNodes, DEFAULT_WEB_LAYOUT_CONFIG),
    [normalizedNodes]
  );

  const nodeById = useMemo(
    () => new Map(normalizedNodes.map((n) => [n.id, n])),
    [normalizedNodes]
  );

  const orderedNodes = useMemo(
    () =>
      layout.orderedNodeIds
        .map((id) => nodeById.get(id))
        .filter((n): n is AnyWorkflowNode => Boolean(n)),
    [layout.orderedNodeIds, nodeById]
  );

  const hasInferredNodes = useMemo(
    () =>
      stage === 'current' &&
      normalizedNodes.some((n) => (n as CurrentStateNode).inferred),
    [stage, normalizedNodes]
  );

  const hasFlags = useMemo(
    () =>
      stage === 'current' &&
      normalizedNodes.some(
        (n) => resolvePainFlagLabels((n as CurrentStateNode).pain_flags).length > 0
      ),
    [stage, normalizedNodes]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    dragOrigin.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollContainerRef.current.scrollLeft,
      scrollTop: scrollContainerRef.current.scrollTop,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragOrigin.current || !scrollContainerRef.current) return;
    const dx = e.clientX - dragOrigin.current.x;
    const dy = e.clientY - dragOrigin.current.y;
    scrollContainerRef.current.scrollLeft = dragOrigin.current.scrollLeft - dx;
    scrollContainerRef.current.scrollTop = dragOrigin.current.scrollTop - dy;
  };

  const stopDrag = () => {
    setIsDragging(false);
    dragOrigin.current = null;
  };

  const handleResetView = () => {
    setZoom(compact ? 0.78 : 0.92);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    }
  };

  if (normalizedNodes.length === 0) {
    return (
      <div className="bg-sage-surface border border-sage-border rounded-2xl p-8 text-center text-sm text-sage-sec">
        No workflow steps are active for this stage.
      </div>
    );
  }

  const arrowColor =
    stage === 'automated'
      ? '#3B82F6'
      : stage === 'redesigned'
      ? '#55745C'
      : '#6C766F';

  return (
    <div className="bg-sage-surface border border-sage-border rounded-2xl overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-sage-border bg-sage-surface-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-white border border-sage-border rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('diagram')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'diagram'
                ? 'bg-sage-primary text-white'
                : 'text-sage-sec hover:text-sage-text'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-sage-primary text-white'
                : 'text-sage-sec hover:text-sage-text'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Accessible List</span>
          </button>
        </div>

        {viewMode === 'diagram' && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.55, Number((z - 0.1).toFixed(2))))}
              aria-label="Zoom out"
              className="w-8 h-8 rounded-lg border border-sage-border bg-white text-sage-sec hover:text-sage-text flex items-center justify-center transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-sage-sec tabular-nums w-11 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
              aria-label="Zoom in"
              className="w-8 h-8 rounded-lg border border-sage-border bg-white text-sage-sec hover:text-sage-text flex items-center justify-center transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              title="Reset zoom & position"
              className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg border border-sage-border bg-white text-xs font-medium text-sage-sec hover:text-sage-text transition-colors"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">Fit</span>
            </button>
          </div>
        )}
      </div>

      {viewMode === 'list' ? (
        <div className="divide-y divide-sage-border max-h-[560px] overflow-y-auto">
          {orderedNodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const cNode = stage === 'current' ? (node as CurrentStateNode) : null;
            const rNode = stage === 'redesigned' ? (node as RedesignedStateNode) : null;
            const aNode = stage === 'automated' ? (node as AutomatedStateNode) : null;
            const stepNum = layout.stepNumbers[node.id];
            const flagLabels = cNode ? resolvePainFlagLabels(cNode.pain_flags) : [];
            const timeLabel = getOptionalNodeTimeLabel(node.time_min, node.time_max);
            const outgoing = (node.edges && node.edges.length > 0
              ? node.edges
              : node.next.map((to) => ({ to, label: '' }))
            ).filter((e) => nodeById.has(e.to));

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectNode(node.id)}
                className={`w-full text-left p-4 transition-colors flex flex-col gap-2 ${
                  isSelected ? 'bg-sage-soft/60' : 'hover:bg-sage-bg'
                } ${cNode?.inferred ? 'border-l-4 border-l-amber-500' : ''}`}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-[#405A46]">
                    {node.type === 'end' ? 'End' : `Step ${stepNum}`}
                  </span>
                  {node.type !== 'task' && node.type !== 'end' && (
                    <span className="text-sage-muted uppercase tracking-wide">{node.type}</span>
                  )}
                  {cNode?.inferred && (
                    <span className="px-2 py-0.5 rounded border border-dashed border-amber-500 bg-amber-50 text-amber-900 font-medium">
                      Inferred
                    </span>
                  )}
                  {rNode && rNode.type !== 'end' && (
                    <span className="px-2 py-0.5 rounded bg-sage-soft text-[#405A46] font-medium">
                      {CHANGE_TYPE_META[rNode.change_type]?.label || rNode.change_type} · {rNode.bridge_letter}
                    </span>
                  )}
                  {aNode && aNode.type !== 'end' && (
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-medium">
                      {AUTOMATION_TYPE_META[aNode.automation.type]?.label}
                    </span>
                  )}
                </div>

                <div className="font-semibold text-sm text-sage-text">{node.label}</div>

                {node.type !== 'end' && (
                  <div className="text-xs text-sage-sec flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>{node.actor || 'Team'}</span>
                    {node.tool && (
                      <>
                        <span>·</span>
                        <span>{node.tool}</span>
                      </>
                    )}
                    {timeLabel && (
                      <>
                        <span>·</span>
                        <span className="tabular-nums">{timeLabel}</span>
                      </>
                    )}
                  </div>
                )}

                {flagLabels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {flagLabels.map((lbl) => (
                      <span
                        key={lbl}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900"
                      >
                        <Flag className="w-2.5 h-2.5" />
                        {lbl}
                      </span>
                    ))}
                  </div>
                )}

                {outgoing.length > 0 && (
                  <div className="text-[11px] text-sage-muted flex flex-wrap gap-2 pt-0.5">
                    {outgoing.map((edge, eIdx) => {
                      const target = nodeById.get(edge.to);
                      const targetNum = layout.stepNumbers[edge.to];
                      const targetName =
                        target?.type === 'end'
                          ? target.label || 'End'
                          : typeof targetNum === 'number'
                          ? `Step ${targetNum}`
                          : target?.label || '';
                      return (
                        <span key={`${edge.to}-${eIdx}`} className="bg-sage-surface-2 px-2 py-0.5 rounded border border-sage-border/80">
                          {edge.label ? `${edge.label} → ` : 'Next → '}
                          {targetName}
                        </span>
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          className={`relative overflow-auto bg-[#F7F8F5] ${
            compact ? 'min-h-[380px] max-h-[540px]' : 'min-h-[420px] max-h-[640px]'
          } ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
          style={{
            backgroundImage: 'radial-gradient(#D5DDD7 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <div
            style={{
              width: Math.max(layout.width * zoom, 320),
              height: layout.height * zoom,
              position: 'relative',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: layout.width,
                height: layout.height,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                position: 'relative',
              }}
            >
              {/* SVG Edges Layer */}
              <svg
                width={layout.width}
                height={layout.height}
                className="absolute inset-0 pointer-events-none"
              >
                <defs>
                  <marker
                    id={`cm-arrow-${stage}-${compact ? 'c' : 'f'}`}
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6.5"
                    markerHeight="6.5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={arrowColor} />
                  </marker>
                  <marker
                    id={`cm-arrow-back-${stage}-${compact ? 'c' : 'f'}`}
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6.5"
                    markerHeight="6.5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#B45309" />
                  </marker>
                </defs>

                {/* Start marker connectors */}
                {layout.startMarker &&
                  layout.startMarker.targetIds.map((tid) => {
                    const targetPos = layout.positions[tid];
                    if (!targetPos) return null;
                    const sx = layout.startMarker!.x + layout.startMarker!.width / 2;
                    const sy = layout.startMarker!.y + layout.startMarker!.height;
                    const ex = targetPos.x + targetPos.width / 2;
                    const ey = targetPos.y;
                    const my = sy + (ey - sy) * 0.5;
                    return (
                      <path
                        key={`start-${tid}`}
                        d={`M ${sx} ${sy} C ${sx} ${my}, ${ex} ${my}, ${ex} ${ey - 4}`}
                        fill="none"
                        stroke={arrowColor}
                        strokeWidth={1.75}
                        markerEnd={`url(#cm-arrow-${stage}-${compact ? 'c' : 'f'})`}
                      />
                    );
                  })}

                {layout.edges.map((edge, idx) => (
                  <path
                    key={`${edge.fromId}-${edge.toId}-${idx}`}
                    d={edge.pathD}
                    fill="none"
                    stroke={edge.isBackEdge ? '#B45309' : arrowColor}
                    strokeWidth={1.75}
                    strokeDasharray={edge.isBackEdge ? '5 4' : undefined}
                    markerEnd={
                      edge.isBackEdge
                        ? `url(#cm-arrow-back-${stage}-${compact ? 'c' : 'f'})`
                        : `url(#cm-arrow-${stage}-${compact ? 'c' : 'f'})`
                    }
                  />
                ))}
              </svg>

              {/* Start Marker Pill */}
              {layout.startMarker && (
                <div
                  style={{
                    left: layout.startMarker.x,
                    top: layout.startMarker.y,
                    width: layout.startMarker.width,
                    height: layout.startMarker.height,
                  }}
                  className="absolute rounded-full border border-[#405A46] bg-[#405A46] text-white text-xs font-semibold flex items-center justify-center shadow-soft"
                >
                  Start
                </div>
              )}

              {/* Edge Condition Labels */}
              {layout.edges.map((edge, idx) =>
                edge.label ? (
                  <div
                    key={`lbl-${edge.fromId}-${edge.toId}-${idx}`}
                    style={{
                      left: edge.labelX,
                      top: edge.labelY,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute pointer-events-none px-2 py-0.5 rounded-md border text-[11px] font-semibold shadow-xs whitespace-nowrap ${
                      edge.isBackEdge
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-white border-sage-border text-sage-text'
                    }`}
                  >
                    {edge.label}
                  </div>
                ) : null
              )}

              {/* Positioned Node Cards Layer */}
              {normalizedNodes.map((node) => {
                const pos = layout.positions[node.id];
                if (!pos) return null;

                const isSelected = node.id === selectedNodeId;
                const cNode = stage === 'current' ? (node as CurrentStateNode) : null;
                const rNode = stage === 'redesigned' ? (node as RedesignedStateNode) : null;
                const aNode = stage === 'automated' ? (node as AutomatedStateNode) : null;
                const timeLabel = getOptionalNodeTimeLabel(node.time_min, node.time_max);
                const flagLabels = cNode ? resolvePainFlagLabels(cNode.pain_flags) : [];

                if (node.type === 'end') {
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => onSelectNode(node.id)}
                      style={{
                        left: pos.x,
                        top: pos.y,
                        width: pos.width,
                        height: pos.height,
                      }}
                      className={`absolute rounded-full border-2 px-3 flex items-center justify-center text-xs font-semibold transition-all shadow-soft ${
                        stage === 'automated'
                          ? 'bg-blue-50 border-blue-500 text-blue-900'
                          : 'bg-sage-soft border-[#405A46] text-[#405A46]'
                      } ${isSelected ? 'ring-2 ring-[#405A46]/30' : ''}`}
                    >
                      <span className="truncate">{node.label || 'End'}</span>
                    </button>
                  );
                }

                const isDecision = node.type === 'decision';
                const isWait = node.type === 'wait';
                const isHandoff = node.type === 'handoff';
                const isInferred = Boolean(cNode?.inferred);

                let borderClasses = 'border-sage-border bg-white hover:border-[#405A46]/70';
                if (isInferred) {
                  borderClasses = 'border-2 border-dashed border-amber-500 bg-amber-50/75 hover:border-amber-600';
                } else if (isDecision) {
                  borderClasses =
                    stage === 'automated'
                      ? 'border-2 border-blue-400 bg-blue-50/35 hover:border-blue-600'
                      : 'border-2 border-[#405A46]/70 bg-[#F4F8F5] hover:border-[#405A46]';
                } else if (isWait) {
                  borderClasses = 'border-dashed border-slate-400 bg-slate-50/80 hover:border-slate-600';
                } else if (stage === 'redesigned') {
                  borderClasses = 'border-sage-primary/50 bg-white hover:border-[#405A46]';
                } else if (stage === 'automated') {
                  borderClasses = 'border-blue-300 bg-white hover:border-blue-500';
                }

                if (isSelected) {
                  borderClasses +=
                    stage === 'automated'
                      ? ' ring-2 ring-blue-500/25'
                      : ' ring-2 ring-[#405A46]/25';
                }

                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => onSelectNode(node.id)}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      width: pos.width,
                      height: pos.height,
                      clipPath: isDecision
                        ? 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)'
                        : undefined,
                    }}
                    className={`absolute text-left rounded-xl border px-3.5 py-2.5 shadow-soft transition-all flex flex-col justify-between focus-visible:outline-none ${borderClasses}`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#405A46]">
                        {isDecision && <GitFork className="w-3 h-3 shrink-0" />}
                        {isWait && <Clock className="w-3 h-3 shrink-0 text-slate-600" />}
                        {isHandoff && <ArrowRightLeft className="w-3 h-3 shrink-0" />}
                        <span>Step {pos.stepNumber}</span>
                        {isDecision && <span className="text-sage-muted">· Decision</span>}
                        {isWait && <span className="text-slate-600">· Wait</span>}
                        {isHandoff && <span className="text-sage-muted">· Handoff</span>}
                      </span>

                      {isInferred ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          Inferred
                        </span>
                      ) : rNode ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sage-soft text-[#405A46] truncate max-w-[110px]">
                          {CHANGE_TYPE_META[rNode.change_type]?.label} · {rNode.bridge_letter}
                        </span>
                      ) : aNode ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 truncate max-w-[116px]">
                          {AUTOMATION_TYPE_META[aNode.automation.type]?.label}
                        </span>
                      ) : null}
                    </div>

                    <div className="font-serif font-bold text-xs text-sage-text leading-snug line-clamp-2">
                      {node.label}
                    </div>

                    {flagLabels.length > 0 && (
                      <div className="flex flex-wrap gap-1 overflow-hidden max-h-[20px]">
                        {flagLabels.slice(0, 2).map((lbl) => (
                          <span
                            key={lbl}
                            className="inline-flex items-center gap-0.5 text-[9.5px] font-medium px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 truncate max-w-[100px]"
                          >
                            {lbl}
                          </span>
                        ))}
                        {flagLabels.length > 2 && (
                          <span className="text-[9.5px] font-medium px-1 py-0.5 rounded bg-amber-50 text-amber-900">
                            +{flagLabels.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 text-[10.5px] text-sage-sec pt-1 border-t border-sage-border/60">
                      <span className="truncate font-medium">
                        {node.actor || 'Unassigned'}
                        {node.tool ? ` · ${node.tool}` : ''}
                      </span>
                      {timeLabel && (
                        <span className="shrink-0 tabular-nums text-sage-muted">{timeLabel}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Compact Conditional Legends */}
      {(hasInferredNodes || hasFlags) && (
        <div className="px-4 py-2.5 border-t border-sage-border bg-sage-surface-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-sage-sec">
          {hasInferredNodes && (
            <div className="inline-flex items-center gap-2">
              <span className="inline-block w-4 h-3 rounded border border-dashed border-amber-500 bg-amber-50" />
              <span>Dashed = we inferred this step from your answers. Please confirm it.</span>
            </div>
          )}
          {hasFlags && (
            <div className="inline-flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-amber-700" />
              <span>Highlighted tags mark friction reported in your answers.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkflowDiagram;
