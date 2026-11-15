import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Columns2,
  FileText,
  Info,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import {
  countHandoffs,
  countOperationalSteps,
  countStageManualSteps,
  formatHoursRange,
} from '../../features/clarity-map/utils/diagramLayout';
import {
  buildStageLookup,
  collectStageEvidenceSummary,
  formatNotAutomatedStepTitle,
  getAutomatedStageStatus,
} from '../../features/clarity-map/utils/clarityMapPresenter';
import {
  trackClarityMapEvent,
  type RateLimitInfo,
} from '../../features/clarity-map/services/clarityMapApi';
import { formatUnlockLocalTime } from './RateLimitCard';
import type {
  ClarityMapResult,
  ClarityMapStage,
  IndustryDefinition,
} from '../../features/clarity-map/types/clarityMap';
import WorkflowDiagram from './WorkflowDiagram';

interface WorkflowResultsViewProps {
  analysis: ClarityMapResult;
  industry?: IndustryDefinition;
  activeStage: ClarityMapStage;
  onChangeStage: (stage: ClarityMapStage) => void;
  onOpenReportModal: () => void;
  onStartOver: () => void;
  reportSentToEmail: string | null;
  rateLimit?: RateLimitInfo | null;
}

const STAGE_TABS: Array<{ id: ClarityMapStage; label: string; subtitle: string }> = [
  { id: 'current', label: '1. Current', subtitle: 'Your process today' },
  { id: 'redesigned', label: '2. Redesigned', subtitle: 'Improved without new software' },
  { id: 'automated', label: '3. Automated', subtitle: 'Safe automation opportunities' },
];

const WorkflowResultsView: React.FC<WorkflowResultsViewProps> = ({
  analysis,
  industry,
  activeStage,
  onChangeStage,
  onOpenReportModal,
  onStartOver,
  reportSentToEmail,
  rateLimit,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [compareSideBySide, setCompareSideBySide] = useState(false);
  const [comparePair, setComparePair] = useState<'1v2' | '2v3'>('1v2');
  const [showEvidenceSource, setShowEvidenceSource] = useState(false);

  const automationStatus = useMemo(() => getAutomatedStageStatus(analysis), [analysis]);

  const redesignedLookup = useMemo(
    () => buildStageLookup(analysis.redesigned_state.nodes),
    [analysis.redesigned_state.nodes]
  );

  const stageNodes = useMemo(() => {
    if (activeStage === 'current') return analysis.current_state.nodes;
    if (activeStage === 'redesigned') return analysis.redesigned_state.nodes;
    return analysis.automated_state.nodes;
  }, [analysis, activeStage]);

  useEffect(() => {
    setSelectedNodeId(stageNodes[0]?.id ?? null);
  }, [activeStage, stageNodes]);

  const evidenceLabels = useMemo(
    () => collectStageEvidenceSummary(analysis, activeStage),
    [analysis, activeStage]
  );

  const stageStats = useMemo(() => {
    const stepCount = countOperationalSteps(stageNodes);
    const manualCount = countStageManualSteps(analysis, activeStage);
    const handoffCount = countHandoffs(stageNodes);
    const weeklyHours =
      activeStage === 'current'
        ? analysis.time_estimate.hours_per_week.current
        : activeStage === 'redesigned'
        ? analysis.time_estimate.hours_per_week.redesigned
        : analysis.time_estimate.hours_per_week.automated;

    const weeklyHoursText = formatHoursRange(weeklyHours.min, weeklyHours.max);

    return { stepCount, manualCount, handoffCount, weeklyHoursText };
  }, [analysis, activeStage, stageNodes]);

  const readinessStyles = useMemo(() => {
    if (analysis.readiness.band === 'Fragile') {
      return 'bg-red-50 text-red-800 border-red-200';
    }
    if (analysis.readiness.band === 'Developing') {
      return 'bg-amber-50 text-amber-900 border-amber-200';
    }
    return 'bg-sage-soft text-[#405A46] border-sage-primary/30';
  }, [analysis.readiness.band]);

  const handleStageSwitch = (stage: ClarityMapStage) => {
    onChangeStage(stage);
    trackClarityMapEvent('stage_viewed', {
      stage,
      process_code: analysis.meta.process_code,
    });
  };

  const renderAutomatedStageCard = (compact = false) => {
    if (automationStatus === 'not_yet') {
      return (
        <div className="bg-sage-surface border border-sage-border rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#405A46]">
              Stage 3 · Automation posture
            </div>
            <h2 className="font-serif text-2xl font-bold text-sage-text">
              Automation: not yet
            </h2>
            <p className="text-sm font-medium text-[#405A46]">
              The redesign already delivers the gain.
            </p>
          </div>

          {analysis.automated_state.reason && (
            <p className="text-sm text-sage-sec leading-relaxed">
              {analysis.automated_state.reason}
            </p>
          )}

          {analysis.automated_state.revisit_when && (
            <div className="bg-sage-surface-2 border border-sage-border rounded-xl px-4 py-3 text-xs sm:text-sm text-sage-text">
              <span className="font-semibold text-[#405A46]">When to revisit automation: </span>
              <span>{analysis.automated_state.revisit_when}</span>
            </div>
          )}

          {analysis.automated_state.not_automated.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-sage-border">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-sage-muted">
                Intentionally left manual
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-sage-sec">
                {analysis.automated_state.not_automated.map((item, idx) => (
                  <li key={`${item.step}-${idx}`} className="flex items-start gap-2">
                    <span className="text-[#405A46] font-bold">•</span>
                    <span>
                      <strong className="text-sage-text">
                        {formatNotAutomatedStepTitle(
                          item.step,
                          redesignedLookup.stepNumbers,
                          analysis.redesigned_state.nodes
                        )}
                        :
                      </strong>{' '}
                      {item.reason}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {automationStatus === 'limited' && (
          <div className="bg-blue-50/75 border border-blue-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-blue-900 font-medium">
            Only these steps are worth automating at your volume.
          </div>
        )}
        <WorkflowDiagram
          stage="automated"
          nodes={analysis.automated_state.nodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => {
            onChangeStage('automated');
            setSelectedNodeId(id);
          }}
          compact={compact}
        />
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Executive Summary Header */}
      <section className="bg-sage-surface border border-sage-border rounded-3xl p-6 sm:p-8 lg:p-10 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#405A46]">
              <span>{analysis.meta.industry}</span>
              <span className="text-sage-border">/</span>
              <span className="font-mono">{analysis.meta.process_code}</span>
              <span className="text-sage-border">/</span>
              <span>Confidence: {analysis.confidence}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-sage-text leading-tight">
              {analysis.meta.process_name}
            </h1>
            <p className="font-serif text-lg sm:text-xl font-semibold text-[#405A46]">
              {analysis.summary.headline}
            </p>
            <p className="text-sm sm:text-base text-sage-sec leading-relaxed">
              {analysis.summary.paragraph}
            </p>

            {/* Collapsible Plain-Language Evidence Line (collapsed by default) */}
            {evidenceLabels.length > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowEvidenceSource((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-muted hover:text-sage-text transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>What shaped this view</span>
                  {showEvidenceSource ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                {showEvidenceSource && (
                  <p className="text-xs text-sage-sec mt-1.5 leading-relaxed">
                    Based on your answers about: {evidenceLabels.join(', ')}.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Readiness & Email-Only Report Trigger Card */}
          <div className="lg:w-72 shrink-0 bg-sage-bg border border-sage-border rounded-2xl p-5 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-sage-muted">
              Operational Readiness
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-serif text-4xl font-bold text-sage-text tabular-nums">
                {analysis.readiness.score_percent}%
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${readinessStyles}`}
              >
                {analysis.readiness.band}
              </span>
            </div>
            <div className="w-full h-2 bg-sage-border/70 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#405A46] rounded-full transition-all duration-500"
                style={{ width: `${analysis.readiness.score_percent}%` }}
              />
            </div>
            <p className="text-[11px] text-sage-muted leading-snug">
              Evaluates operating system maturity across process, roles, systems, data, governance, and review — showing which foundations to strengthen first.
            </p>
            <div className="pt-2 border-t border-sage-border/70 flex flex-col gap-2">
              {reportSentToEmail ? (
                <div className="flex items-start gap-2 bg-sage-soft/80 border border-sage-primary/25 rounded-xl px-3.5 py-2.5 text-xs text-[#405A46] font-medium leading-snug">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Full PDF report sent to {reportSentToEmail}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenReportModal}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#405A46] hover:bg-[#334838] text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Email me the full report</span>
                </button>
              )}
              <button
                type="button"
                onClick={onStartOver}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-sage-sec hover:text-sage-text py-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Map another workflow</span>
              </button>
              {rateLimit && (() => {
                if (rateLimit.remaining === 1) {
                  return (
                    <p className="text-[11px] text-sage-muted text-center pt-0.5">
                      1 free map left today
                    </p>
                  );
                }
                if (rateLimit.remaining > 1) {
                  return (
                    <p className="text-[11px] text-sage-muted text-center pt-0.5">
                      {rateLimit.remaining} free maps left today
                    </p>
                  );
                }
                const unlockTime = formatUnlockLocalTime(rateLimit.reset_at);
                if (!unlockTime) return null;
                return (
                  <p className="text-[11px] text-sage-muted text-center pt-0.5 leading-snug">
                    You've used both free maps today. The next unlocks at {unlockTime}.
                  </p>
                );
              })()}
            </div>
          </div>
        </div>

        {industry?.regulated && industry.regulatedNotice && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-950 leading-relaxed">{industry.regulatedNotice}</p>
          </div>
        )}
      </section>

      {/* Interactive 3-Stage Visual Map Section (Nothing rendered below the visual map) */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-sage-surface border border-sage-border p-1.5 rounded-2xl flex-1"
            role="tablist"
            aria-label="Workflow Transformation Stages"
          >
            {STAGE_TABS.map((tab) => {
              const isActive = !compareSideBySide && activeStage === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setCompareSideBySide(false);
                    handleStageSwitch(tab.id);
                  }}
                  className={`text-left px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#405A46] text-white shadow-soft'
                      : 'text-sage-text hover:bg-sage-surface-2'
                  }`}
                >
                  <div className="font-serif font-bold text-sm">{tab.label}</div>
                  <div
                    className={`text-xs mt-0.5 ${
                      isActive ? 'text-sage-soft' : 'text-sage-muted'
                    }`}
                  >
                    {tab.subtitle}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tablet+ Side-by-Side Comparison Toggle */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCompareSideBySide((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold transition-colors ${
                compareSideBySide
                  ? 'bg-sage-soft border-[#405A46] text-[#405A46]'
                  : 'bg-sage-surface border-sage-border text-sage-text hover:bg-sage-surface-2'
              }`}
            >
              <Columns2 className="w-4 h-4" />
              <span>{compareSideBySide ? 'Single stage view' : 'Side-by-side compare'}</span>
            </button>

            {compareSideBySide && (
              <select
                aria-label="Stages to compare"
                value={comparePair}
                onChange={(e) => setComparePair(e.target.value as '1v2' | '2v3')}
                className="px-3 py-3 rounded-xl border border-sage-border bg-sage-surface text-xs font-semibold text-sage-text"
              >
                <option value="1v2">Stage 1 vs Stage 2</option>
                <option value="2v3">Stage 2 vs Stage 3</option>
              </select>
            )}
          </div>
        </div>

        {/* Comparison Metrics Strip (hide hours card when time data is null) */}
        {!compareSideBySide && !(activeStage === 'automated' && automationStatus === 'not_yet') && (
          <div
            className={`grid gap-3 ${
              stageStats.weeklyHoursText ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'
            }`}
          >
            <div className="bg-sage-surface border border-sage-border rounded-xl p-4">
              <div className="text-xs text-sage-muted">Workflow steps</div>
              <div className="font-serif text-2xl font-bold text-sage-text tabular-nums mt-1">
                {stageStats.stepCount}
              </div>
            </div>
            <div className="bg-sage-surface border border-sage-border rounded-xl p-4">
              <div className="text-xs text-sage-muted">
                {activeStage === 'automated' ? 'Fully human-led steps' : 'Active work steps'}
              </div>
              <div className="font-serif text-2xl font-bold text-sage-text tabular-nums mt-1">
                {stageStats.manualCount}
              </div>
            </div>
            <div className="bg-sage-surface border border-sage-border rounded-xl p-4">
              <div className="text-xs text-sage-muted">Handoff points</div>
              <div className="font-serif text-2xl font-bold text-sage-text tabular-nums mt-1">
                {stageStats.handoffCount}
              </div>
            </div>
            {stageStats.weeklyHoursText && (
              <div className="bg-sage-surface border border-sage-border rounded-xl p-4">
                <div className="text-xs text-sage-muted">Est. weekly team time</div>
                <div className="font-serif text-2xl font-bold text-[#405A46] tabular-nums mt-1">
                  {stageStats.weeklyHoursText}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Interactive Visual Map / Accessible List */}
        {compareSideBySide ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {comparePair === '1v2' ? (
              <>
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-sage-muted">
                    Stage 1 · Your process today ({countOperationalSteps(analysis.current_state.nodes)} steps)
                  </div>
                  <WorkflowDiagram
                    stage="current"
                    nodes={analysis.current_state.nodes}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={(id) => {
                      onChangeStage('current');
                      setSelectedNodeId(id);
                    }}
                    compact
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#405A46]">
                    Stage 2 · Improved without new software ({countOperationalSteps(analysis.redesigned_state.nodes)} steps)
                  </div>
                  <WorkflowDiagram
                    stage="redesigned"
                    nodes={analysis.redesigned_state.nodes}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={(id) => {
                      onChangeStage('redesigned');
                      setSelectedNodeId(id);
                    }}
                    compact
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#405A46]">
                    Stage 2 · Improved without new software ({countOperationalSteps(analysis.redesigned_state.nodes)} steps)
                  </div>
                  <WorkflowDiagram
                    stage="redesigned"
                    nodes={analysis.redesigned_state.nodes}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={(id) => {
                      onChangeStage('redesigned');
                      setSelectedNodeId(id);
                    }}
                    compact
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-blue-700">
                    Stage 3 · Automated opportunities ({countOperationalSteps(analysis.automated_state.nodes)} steps)
                  </div>
                  {renderAutomatedStageCard(true)}
                </div>
              </>
            )}
          </div>
        ) : activeStage === 'automated' ? (
          renderAutomatedStageCard(false)
        ) : (
          <WorkflowDiagram
            stage={activeStage}
            nodes={stageNodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        )}
      </section>
    </div>
  );
};

export default WorkflowResultsView;
