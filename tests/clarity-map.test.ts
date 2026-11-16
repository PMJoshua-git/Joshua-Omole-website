import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import {
  getAllProcesses,
  getCommonQuestions,
  getIndustries,
  getProcessesByIndustry,
  getQuestionDisplayText,
  getVisibleQuestions,
} from '../features/clarity-map/services/processLibrary';
import {
  computeVolumeContext,
  VOLUME_BAND_HIGH_MIN,
  VOLUME_BAND_LOW_MAX,
} from '../features/clarity-map/services/volumeContext';
import {
  getQuestionLabel,
  QUESTION_LABEL_REGISTRY,
  resolveEvidenceLabels,
} from '../features/clarity-map/utils/questionRegistry';
import {
  reportRequestSchema,
  sanitizeAnswerText,
  sanitizeSubmission,
} from '../features/clarity-map/schemas/questionnaire.schema';
import {
  computeReadiness,
  computeRedesignShare,
  findReaderFacingLeaks,
  validateClarityMapAnalysis,
} from '../features/clarity-map/schemas/analysis-result.schema';
import {
  computeWorkflowLayout,
  resolvePainFlagLabels,
} from '../features/clarity-map/utils/diagramLayout';
import {
  formatReplacesTodayText,
  formatStepReferences,
  getAutomatedStageStatus,
  hasAnyTimeData,
  stageHasInferredNodes,
} from '../features/clarity-map/utils/clarityMapPresenter';
import { generateClarityMapPdf } from '../server/clarity-map/reports/generatePdf';
import {
  LoopsConfigurationError,
  syncClarityMapContactToLoops,
} from '../server/clarity-map/crm/loopsSync';
import { normalizeGeminiOutputForV2 } from '../server/clarity-map/ai/geminiAnalyzer';
import type { ClarityMapResult, QuestionAnswerValue } from '../features/clarity-map/types/clarityMap';

/**
 * Legacy v1 stored record fixture (no schema_version, no edges, no end node,
 * no structured automation fields) to guarantee backward compatibility.
 */
function makeLegacyV1Result(): ClarityMapResult {
  return {
    meta: {
      industry: 'Digital Agencies',
      process_code: 'DA-01',
      process_name: 'Client Onboarding',
      questionnaire_version: '1.0',
      analysis_version: '1.0',
    },
    confidence: 'high',
    summary: {
      headline: 'Client details are re-typed three times before kickoff starts.',
      paragraph:
        'Your onboarding relies on manual inbox chasing and memory-driven handoffs between sales and delivery. Fixing ownership and using one intake form removes nearly half the friction before any automation is added.',
    },
    current_state: {
      nodes: [
        {
          id: 'c1',
          label: 'Lead signs proposal in email',
          type: 'task',
          actor: 'Founder',
          tool: 'Email',
          time_min: 10,
          time_max: 20,
          next: ['c2'],
          pain_flags: ['no_record'],
          inferred: false,
          evidence: ['DA01_Q1'],
        },
        {
          id: 'c2',
          label: 'Team chases client files on chat',
          type: 'wait',
          actor: 'Account Manager',
          tool: 'WhatsApp',
          time_min: 30,
          time_max: 90,
          next: ['c3'],
          pain_flags: ['waiting', 're_entry'],
          inferred: false,
          evidence: ['C3', 'C4'],
        },
        {
          id: 'c3',
          label: 'Handoff to delivery lead',
          type: 'handoff',
          actor: 'Founder',
          tool: 'Spreadsheet',
          time_min: 15,
          time_max: 30,
          next: [],
          pain_flags: ['single_person_dependency', 'no_owner'],
          inferred: false,
          evidence: [], // Intentionally empty -> renderer must infer=true
        },
      ],
      visibility_gaps: ['Exact time waiting on client assets is not tracked anywhere.'],
    },
    bridge_diagnosis: {
      B: { score: 1, finding: 'Steps live in memory rather than a checklist.', evidence: ['C8'] },
      R: { score: 1, finding: 'Account Manager and Founder overlap on kickoff.', evidence: ['C2'] },
      I: { score: 1, finding: 'Email, WhatsApp, and Spreadsheet are disconnected.', evidence: ['C3'] },
      D: { score: 2, finding: 'Spreadsheet holds basic client info but lags.', evidence: ['C3_master'] },
      G: { score: 1, finding: 'No rule or escalation when files arrive late.', evidence: ['C4'] },
      E: { score: 0, finding: 'Process is rarely reviewed after delivery begins.', evidence: ['C9'] },
    },
    redesigned_state: {
      nodes: [
        {
          id: 'r1',
          label: 'Send single kickoff intake checklist',
          type: 'task',
          actor: 'Account Manager',
          tool: 'Email + Existing Form',
          time_min: 5,
          time_max: 10,
          next: ['r2'],
          change_type: 'standardised',
          bridge_letter: 'B',
          replaces: ['c1', 'c2'],
          rationale: 'Combines proposal sign-off and asset collection into one repeatable checklist.',
        },
        {
          id: 'r2',
          label: 'Update master tracker and book kickoff',
          type: 'task',
          actor: 'Delivery Lead',
          tool: 'Master Spreadsheet',
          time_min: 10,
          time_max: 15,
          next: [],
          change_type: 'assigned',
          bridge_letter: 'R',
          replaces: ['c3'],
          rationale: 'Gives Delivery Lead single ownership once intake is complete.',
        },
      ],
      removed: [
        {
          replaces: ['c2'],
          bridge_letter: 'G',
          reason: 'Eliminates ad-hoc WhatsApp chasing by setting a 48-hour intake rule.',
        },
      ],
      rules_introduced: ['No kickoff call is scheduled until mandatory intake items are checked off.'],
    },
    automated_state: {
      nodes: [
        {
          id: 'a1',
          label: 'Auto-log intake form and send confirmation',
          type: 'task',
          actor: 'Workflow Automation',
          tool: 'Intake Form + Sheet',
          time_min: 1,
          time_max: 2,
          next: ['a2'],
          automation: {
            type: 'capture_form',
            description: 'Captures client assets once, logs them to the master sheet, and notifies Delivery Lead.',
            human_checkpoint: 'Account Manager reviews submitted assets for completeness before kickoff.',
          },
          from: ['r1'],
        },
        {
          id: 'a2',
          label: 'Delivery Lead runs readiness check',
          type: 'decision',
          actor: 'Delivery Lead',
          tool: 'Master Tracker',
          time_min: 5,
          time_max: 10,
          next: [],
          automation: {
            type: 'scheduled_reminder',
            description: 'Sends automated 48-hour reminder if intake assets remain incomplete.',
            human_checkpoint: 'Delivery Lead handles bespoke client scope exceptions manually.',
          },
          from: ['r2'],
        },
      ],
      not_automated: [
        {
          step: 'r2',
          reason: 'Kickoff scope alignment requires live human conversation and judgement.',
        },
      ],
    },
    time_estimate: {
      runs_per_week: { min: 4, max: 6 },
      hours_per_week: {
        current: { min: 4, max: 14 },
        redesigned: { min: 1, max: 3 },
        automated: { min: 0.5, max: 1.5 },
      },
      redesign_share_percent: { min: 0, max: 0 },
      assumptions: ['Calculated from 4–6 weekly new clients and typical chasing duration.'],
      caveat: 'Figures represent indicative weekly ranges based on estimates rather than live tracking.',
    },
    bottlenecks: [
      {
        title: 'Scattered asset chasing across WhatsApp and email',
        why_it_matters: 'Delays project start and consumes senior team time.',
        step_ids: ['c2'],
        bridge_letter: 'I',
      },
      {
        title: 'Founder acting as informal handoff router',
        why_it_matters: 'Creates single-person dependency whenever client volume spikes.',
        step_ids: ['c3'],
        bridge_letter: 'R',
      },
      {
        title: 'No written intake rule before scheduling kickoff',
        why_it_matters: 'Teams start work missing critical logins or brand files.',
        step_ids: ['c1', 'c2'],
        bridge_letter: 'G',
      },
    ],
    quick_wins: [
      {
        action: 'Create one shared onboarding checklist template in your existing doc tool.',
        step_ids: ['c1'],
        needs_new_software: false,
        time_to_do: 'under 1 hour',
      },
    ],
    automation_opportunities: [
      {
        name: 'Sync client intake form straight into Master Tracker',
        effort: 'low',
        impact: 'high',
        step_ids: ['r1'],
      },
    ],
    implementation_order: [
      { week: 1, focus: 'Standardise intake & assign owners', actions: ['Publish one-page intake checklist'] },
      { week: 2, focus: 'Enforce master tracker & 48h rule', actions: ['Stop ad-hoc WhatsApp updates'] },
      { week: 3, focus: 'Connect intake form to tracker', actions: ['Test automatic row creation'] },
      { week: 4, focus: 'Review metrics & refine service standard', actions: ['Audit weekly kickoff turnaround time'] },
    ],
    readiness: {
      score_percent: 99,
      band: 'Ready to scale',
    },
    crm_tags: {
      industry: 'Digital Agencies',
      process_code: 'DA-01',
      readiness_band: 'Ready to scale',
      top_bottleneck_bridge_letter: 'R',
      volume_band: 'Weekly (4–6/wk)',
    },
    cta: 'Wrong CTA placeholder',
  };
}

/**
 * Schema v2 fixture for Real Estate RE-03 (Property maintenance request)
 * with branching decisions, inferred handoff, low/medium volume, and zero reader-facing ID leaks.
 */
function makeRe03V2Fixture(): ClarityMapResult {
  return {
    schema_version: 2,
    meta: {
      industry: 'Real Estate',
      process_code: 'RE-03',
      process_name: 'Property maintenance request',
      questionnaire_version: '1.0.0',
      analysis_version: '2.0.0',
    },
    confidence: 'medium',
    summary: {
      headline: 'Maintenance requests stall between informal triage and ad-hoc owner spend approvals.',
      paragraph:
        'Requests arrive across calls, chats, and emails without a consistent urgency rule or single tracker. Defining one intake channel, a written urgency triage rule, and a pre-agreed repair limit eliminates most delays before any software is added. Because weekly volume sits below ten requests, only lightweight reminders and capture forms make sense right now.',
    },
    current_state: {
      nodes: [
        {
          id: 'c1',
          label: 'Log tenant maintenance request',
          type: 'task',
          actor: 'Property Coordinator',
          tool: 'WhatsApp / Email',
          time_min: 10,
          time_max: 20,
          next: ['c2'],
          edges: [{ to: 'c2', label: '' }],
          pain_flags: ['no_record', 're_entry'],
          inferred: false,
          evidence: ['RE03_Q1'],
        },
        {
          id: 'c2',
          label: 'Judge request urgency',
          type: 'decision',
          actor: 'Property Manager',
          tool: 'Memory',
          time_min: 5,
          time_max: 15,
          next: ['c3', 'c4'],
          edges: [
            { to: 'c3', label: 'Routine spend check' },
            { to: 'c4', label: 'Emergency dispatch' },
          ],
          pain_flags: ['no_rule', 'single_person_dependency'],
          inferred: false,
          evidence: ['RE03_Q2'],
        },
        {
          id: 'c3',
          label: 'Wait for landlord spend approval',
          type: 'wait',
          actor: 'Property Owner',
          tool: 'WhatsApp / Phone',
          time_min: 15,
          time_max: 30,
          next: ['c4'],
          edges: [{ to: 'c4', label: 'Approved' }],
          pain_flags: ['waiting', 'no_status'],
          inferred: false,
          evidence: ['RE03_Q4', 'C4'],
        },
        {
          id: 'c4',
          label: 'Pass brief to preferred contractor',
          type: 'handoff',
          actor: 'Property Manager',
          tool: 'WhatsApp',
          time_min: 15,
          time_max: 30,
          next: ['c5'],
          edges: [{ to: 'c5', label: '' }],
          pain_flags: ['rework_risk', 'no_owner'],
          inferred: true,
          evidence: [], // Intentionally empty -> validator guarantees inferred=true
        },
        {
          id: 'c5',
          label: 'Confirm work completed with tenant',
          type: 'task',
          actor: 'Property Coordinator',
          tool: 'Email / Phone',
          time_min: 10,
          time_max: 20,
          next: ['c6'],
          edges: [{ to: 'c6', label: '' }],
          pain_flags: ['no_review'],
          inferred: false,
          evidence: ['RE03_Q6'],
        },
        {
          id: 'c6',
          label: 'Log costs manually at month end',
          type: 'task',
          actor: 'Accounts Assistant',
          tool: 'Spreadsheet',
          time_min: 15,
          time_max: 45,
          next: ['c7'],
          edges: [{ to: 'c7', label: '' }],
          pain_flags: ['re_entry', 'no_record'],
          inferred: false,
          evidence: ['RE03_Q7', 'C3'],
        },
        {
          id: 'c7',
          label: 'Request closed',
          type: 'end',
          actor: 'Property Coordinator',
          tool: 'Spreadsheet',
          time_min: null,
          time_max: null,
          next: [],
          edges: [],
          pain_flags: [],
          inferred: false,
          evidence: ['RE03_Q6'],
        },
      ],
      visibility_gaps: [
        'Total waiting hours between quote sent and landlord reply are untracked.',
        'Tenant access delays with contractors are not logged consistently.',
      ],
    },
    bridge_diagnosis: {
      B: { score: 1, finding: 'Urgency decisions vary case by case instead of following documented standards.', evidence: ['RE03_Q2'] },
      R: { score: 2, finding: 'Property Manager carries scheduling, approval chasing, and escalation alone.', evidence: ['C2'] },
      I: { score: 1, finding: 'Photos, landlord replies, and contractor invoices sit in separate threads.', evidence: ['RE03_Q7'] },
      D: { score: 1, finding: 'Costs are compiled into spreadsheets only at month-end rather than live.', evidence: ['C3_master'] },
      G: { score: 1, finding: 'Every non-emergency repair stalls waiting for case-by-case landlord approval.', evidence: ['RE03_Q4'] },
      E: { score: 1, finding: 'Repeat property faults are reviewed only when a tenant or owner complains.', evidence: ['C10'] },
    },
    redesigned_state: {
      nodes: [
        {
          id: 'r1',
          label: 'Submit single repair intake ticket',
          type: 'task',
          actor: 'Property Coordinator',
          tool: 'Existing Web Form',
          time_min: 5,
          time_max: 10,
          next: ['r2'],
          edges: [{ to: 'r2', label: '' }],
          change_type: 'standardised',
          bridge_letter: 'D',
          replaces: ['c1'],
          rationale: 'Captures property address, issue photos, and tenant access window in one place first time.',
        },
        {
          id: 'r2',
          label: 'Apply written urgency and spend rule',
          type: 'decision',
          actor: 'Property Coordinator',
          tool: 'Urgency Checklist',
          time_min: 5,
          time_max: 8,
          next: ['r3', 'r4'],
          edges: [
            { to: 'r3', label: 'Above spend limit' },
            { to: 'r4', label: 'Within limit' },
          ],
          change_type: 'rule_added',
          bridge_letter: 'G',
          replaces: ['c2'],
          rationale: 'Lets the Coordinator classify urgency and act immediately under the pre-agreed threshold.',
        },
        {
          id: 'r3',
          label: 'Request owner sign-off with deadline',
          type: 'task',
          actor: 'Property Manager',
          tool: 'Email',
          time_min: 5,
          time_max: 10,
          next: ['r4'],
          edges: [{ to: 'r4', label: 'Approved' }],
          change_type: 'assigned',
          bridge_letter: 'G',
          replaces: ['c3'],
          rationale: 'Restricts landlord approval strictly to jobs above the agreed spend limit with a 24-hour target.',
        },
        {
          id: 'r4',
          label: 'Dispatch contractor with written job brief',
          type: 'handoff',
          actor: 'Property Coordinator',
          tool: 'Shared Maintenance Tracker',
          time_min: 8,
          time_max: 15,
          next: ['r5'],
          edges: [{ to: 'r5', label: '' }],
          change_type: 'reordered',
          bridge_letter: 'R',
          replaces: ['c4'],
          rationale: 'Standardises job brief details and tenant contact windows before contractor dispatch.',
        },
        {
          id: 'r5',
          label: 'Verify photo proof and close record',
          type: 'task',
          actor: 'Property Coordinator',
          tool: 'Shared Maintenance Tracker',
          time_min: 8,
          time_max: 12,
          next: ['r6'],
          edges: [{ to: 'r6', label: '' }],
          change_type: 'merged',
          bridge_letter: 'I',
          replaces: ['c5', 'c6'],
          rationale: 'Updates costs and completion photos on the central log immediately instead of re-typing at month-end.',
        },
        {
          id: 'r6',
          label: 'Closed in maintenance log',
          type: 'end',
          actor: 'Property Coordinator',
          tool: 'Shared Maintenance Tracker',
          time_min: null,
          time_max: null,
          next: [],
          edges: [],
          change_type: 'unchanged',
          bridge_letter: 'B',
          replaces: ['c7'],
          rationale: 'Records final job status cleanly for future owner statements.',
        },
      ],
      removed: [
        {
          replaces: ['c6'],
          bridge_letter: 'I',
          reason: 'Eliminates separate month-end spreadsheet re-typing by logging invoices at closure.',
        },
      ],
      rules_introduced: [
        'Emergency issues dispatch within 2 hours under written triage definitions.',
        'Repairs below the landlord spend threshold require no separate approval wait.',
      ],
    },
    automated_state: {
      status: 'limited',
      reason: 'Weekly request volume is low, so only lightweight intake capture and status updates pay back immediately.',
      revisit_when: 'Revisit automated contractor dispatch when volume reaches 15 or more repairs per week.',
      nodes: [
        {
          id: 'a1',
          label: 'Log tenant intake form automatically',
          type: 'task',
          actor: 'Property Coordinator',
          tool: 'Existing Web Form + Tracker',
          time_min: 1,
          time_max: 2,
          next: ['a2'],
          edges: [{ to: 'a2', label: '' }],
          automation: {
            type: 'capture_form',
            description: 'Saves tenant form photos and details directly to the property tracker and notifies Coordinator.',
            function: 'Create maintenance ticket row from form submission',
            trigger: 'Tenant submits web repair form',
            input: 'Property unit, fault description, photo, access preference',
            action: 'Append structured row and assign Coordinator',
            exception_route: 'Send plain inbox alert if required photo is missing',
            owner: 'Property Coordinator',
            human_checkpoint: 'Coordinator reviews emergency urgency tag before dispatch',
          },
          from: ['r1'],
        },
        {
          id: 'a2',
          label: 'Send scheduled owner approval reminder',
          type: 'task',
          actor: 'Property Manager',
          tool: 'Email',
          time_min: 1,
          time_max: 2,
          next: ['a3'],
          edges: [{ to: 'a3', label: '' }],
          automation: {
            type: 'scheduled_reminder',
            description: 'Follows up pending quotes above threshold after 24 hours with summary details.',
            function: 'Scheduled pending approval nudge',
            trigger: 'Ticket stays in awaiting owner approval for 24 hours',
            input: 'Property name, contractor quote, urgency rating',
            action: 'Email owner reminder and flag Coordinator',
            exception_route: 'Notify Property Manager if bounced or unanswered after 48 hours',
            owner: 'Property Manager',
            human_checkpoint: 'Property Manager handles phone escalation with landlord',
          },
          from: ['r3'],
        },
        {
          id: 'a3',
          label: 'Ticket tracked to completion',
          type: 'end',
          actor: 'Property Coordinator',
          tool: 'Shared Maintenance Tracker',
          time_min: null,
          time_max: null,
          next: [],
          edges: [],
          automation: {
            type: 'status_notification',
            description: 'Confirms ticket closure to tenant automatically.',
            function: 'Close loop message',
            trigger: 'Status set to Closed',
            input: 'Tenant email, completion note',
            action: 'Send brief confirmation message',
            exception_route: 'Skip message if tenant contact email is missing',
            owner: 'Property Coordinator',
            human_checkpoint: 'none',
          },
          from: ['r5'],
        },
      ],
      not_automated: [
        {
          step: 'r2',
          reason: 'Distinguishing borderline safety emergencies from routine repairs requires coordinator judgement.',
        },
        {
          step: 'r4',
          reason: 'Briefing contractors on property quirks and tenant access benefits from direct communication.',
        },
      ],
    },
    time_estimate: {
      runs_per_week: { min: 4, max: 8 },
      hours_per_week: {
        current: { min: 4, max: 11 },
        redesigned: { min: 2, max: 5 },
        automated: { min: 1.5, max: 4 },
      },
      redesign_share_percent: { min: 0, max: 0 },
      assumptions: ['Calculated from 4 to 8 maintenance tickets per week and reported hands-on minutes.'],
      caveat: 'These are estimates of hands-on time based on your answers. They exclude waiting time between steps.',
    },
    bottlenecks: [
      {
        title: 'Every non-emergency repair waits for landlord approval',
        why_it_matters: 'Small repairs stall for days while the manager chases owners by phone and chat.',
        step_ids: ['c3'],
        bridge_letter: 'G',
      },
      {
        title: 'Missing urgency criteria puts triage on one person',
        why_it_matters: 'Tenants call repeatedly when routine and urgent requests sit in the same inbox.',
        step_ids: ['c2'],
        bridge_letter: 'B',
      },
      {
        title: 'Invoices and photos live in separate places until month-end',
        why_it_matters: 'Creates double data entry for accounts and hides repeat property issues.',
        step_ids: ['c6'],
        bridge_letter: 'I',
      },
    ],
    quick_wins: [
      {
        action: 'Publish a one-page emergency vs routine triage checklist for staff.',
        step_ids: ['c2'],
        needs_new_software: false,
        time_to_do: 'under 1 hour',
      },
      {
        action: 'Add a default repair float clause for managed landlords so small jobs move without waiting.',
        step_ids: ['c3'],
        needs_new_software: false,
        time_to_do: 'half a day',
      },
      {
        action: 'Capture unit, fault photos, and entry window in one intake form before assigning contractors.',
        step_ids: ['c1'],
        needs_new_software: false,
        time_to_do: 'half a day',
      },
    ],
    automation_opportunities: [
      {
        name: 'Auto-log maintenance intake form into property tracker',
        effort: 'low',
        impact: 'medium',
        step_ids: ['r1'],
        verdict: 'worth_it_now',
        why_this_volume: 'Saves repetitive copying even at 4 to 8 requests per week using tools you already have.',
        revisit_when: null,
      },
      {
        name: 'Automated contractor dispatch routing engine',
        effort: 'high',
        impact: 'low',
        step_ids: ['r4'],
        verdict: 'worth_it_later',
        why_this_volume: 'At fewer than ten requests a week, building custom trade routing would cost more time than it saves.',
        revisit_when: 'When weekly maintenance tickets consistently exceed 15 per week.',
      },
    ],
    implementation_order: [
      {
        week: 1,
        focus: 'Establish baseline timing and assign single coordinator ownership',
        actions: [
          'Time each step across your next 5 to 10 real maintenance requests in a shared sheet.',
          'Assign Property Coordinator as single intake owner.',
        ],
        includes_baseline: true,
      },
      {
        week: 2,
        focus: 'Introduce urgency checklist and landlord float rules',
        actions: [
          'Roll out written emergency, urgent, and routine turnaround rules.',
          'Agree standard below-threshold repair limit with property owners.',
        ],
      },
      {
        week: 3,
        focus: 'Enable intake form capture and 24-hour quote reminder',
        actions: [
          'Connect web maintenance form to shared property tracker row.',
          'Configure 24-hour reminder for above-threshold quotes.',
        ],
      },
      {
        week: 4,
        focus: 'Compare turnaround times with Week 1 numbers and tune workflow',
        actions: [
          'Compare measured resolution times against Week 1 results and review repeat faults.',
        ],
      },
    ],
    readiness: {
      score_percent: 29,
      band: 'Fragile',
    },
    crm_tags: {
      industry: 'Real Estate',
      process_code: 'RE-03',
      readiness_band: 'Fragile',
      top_bottleneck_bridge_letter: 'G',
      volume_band: 'low',
    },
    cta: 'Want this checked against how your business really runs? Book a 30-minute Systems Clarity Audit.',
  };
}

/**
 * Industry #2: Professional Services (PS-01 Proposal to signed engagement),
 * "not_yet" automation posture with seasonal/unknown volume & null times variant.
 */
function makeSeasonalNotYetFixture(): ClarityMapResult {
  const base = makeRe03V2Fixture();
  return {
    ...base,
    meta: {
      industry: 'Professional Services',
      process_code: 'PS-01',
      process_name: 'Proposal to signed engagement',
      questionnaire_version: '1.0.0',
      analysis_version: '2.0.0',
    },
    summary: {
      headline: 'Bespoke scoping stalls when margin and delivery sign-off rely on ad-hoc partner chats.',
      paragraph:
        'Each seasonal engagement requires partner judgment, yet scope risks are caught too late in email chains. Tightening your intake checklist and sign-off sequence captures virtually all the improvement without software.',
    },
    current_state: {
      ...base.current_state,
      nodes: base.current_state.nodes.map((n) => ({
        ...n,
        inferred: false,
        evidence: n.evidence.length > 0 ? n.evidence : ['PS01_Q2'],
        pain_flags: n.type === 'end' ? [] : ['waiting'],
      })),
    },
    automated_state: {
      status: 'not_yet',
      reason: 'With seasonal volume of 11 to 25 engagements per season and high customization, human partner review drives accuracy far more than software.',
      revisit_when: 'Revisit proposal automation when volume settles above 10 recurring proposals every week.',
      nodes: [],
      not_automated: [
        {
          step: 'r2',
          reason: 'Scope margin and liability terms require partner sign-off on every bespoke engagement.',
        },
        {
          step: 'r4',
          reason: 'Client kickoff expectations require tailored partner briefing.',
        },
      ],
    },
    time_estimate: {
      runs_per_week: { min: null, max: null },
      hours_per_week: {
        current: { min: 6, max: 12 },
        redesigned: { min: 3, max: 6 },
        automated: { min: 99, max: 99 }, // Validator must align this to redesigned when status="not_yet"
      },
      redesign_share_percent: { min: null, max: null },
      assumptions: ['Seasonal intake cadence prevents fixed weekly run rate estimation.'],
      caveat: 'These are estimates of hands-on time based on your answers. They exclude waiting time between steps.',
    },
    automation_opportunities: [
      {
        name: 'Standard template merge from scoping sheet',
        effort: 'medium',
        impact: 'low',
        step_ids: ['r1'],
        verdict: 'worth_it_later',
        why_this_volume: 'At 11 to 25 requests a season, custom proposal drafting would not pay back yet.',
        revisit_when: 'When proposals run weekly at 10 or more per week.',
      },
    ],
    crm_tags: {
      industry: 'Professional Services',
      process_code: 'PS-01',
      readiness_band: 'Fragile',
      top_bottleneck_bridge_letter: 'G',
      volume_band: 'unknown',
    },
  };
}

/**
 * Industry #3: E-Commerce (EC-01 Order fulfilment and dispatch), high volume (up to 5 automations).
 */
function makeHighVolumeEcommerceFixture(): ClarityMapResult {
  const base = makeRe03V2Fixture();
  return {
    ...base,
    meta: {
      industry: 'E-Commerce',
      process_code: 'EC-01',
      process_name: 'Order fulfilment and dispatch',
      questionnaire_version: '1.0.0',
      analysis_version: '2.0.0',
    },
    current_state: {
      ...base.current_state,
      nodes: base.current_state.nodes.map((n) => ({
        ...n,
        inferred: false,
        evidence: ['EC01_Q1'],
      })),
    },
    automated_state: {
      status: 'recommended',
      reason: null,
      revisit_when: null,
      nodes: [
        {
          id: 'a1',
          label: 'Sync store orders to packing queue',
          type: 'task',
          actor: 'Fulfilment Lead',
          tool: 'Store + Warehouse Sheet',
          time_min: 1,
          time_max: 2,
          next: ['a2'],
          edges: [{ to: 'a2', label: '' }],
          automation: {
            type: 'sync_between_systems',
            description: 'Pushes paid orders directly into daily pick-and-pack batch queue.',
            function: 'Order queue sync',
            trigger: 'Payment confirmed in storefront',
            input: 'Order SKU list, shipping tier, address',
            action: 'Create warehouse pick line item',
            exception_route: 'Hold flagged out-of-stock SKUs for Operations review',
            owner: 'Fulfilment Lead',
            human_checkpoint: 'Packer scans items against pick slip before sealing',
          },
          from: ['r1'],
        },
        {
          id: 'a2',
          label: 'Route express vs standard parcels',
          type: 'decision',
          actor: 'Dispatch Coordinator',
          tool: 'Shipping Rules',
          time_min: 1,
          time_max: 2,
          next: ['a3', 'a4'],
          edges: [
            { to: 'a3', label: 'Express tier' },
            { to: 'a4', label: 'Standard tier' },
          ],
          automation: {
            type: 'rule_based_routing',
            description: 'Separates express cutoff parcels from standard courier runs automatically.',
            function: 'Tier sorting rule',
            trigger: 'Pick slip generated',
            input: 'Shipping service tier and weight',
            action: 'Assign carrier manifest batch',
            exception_route: 'Route oversized parcels to Freight Coordinator',
            owner: 'Dispatch Coordinator',
            human_checkpoint: 'Coordinator signs manifest before courier handoff',
          },
          from: ['r2'],
        },
        {
          id: 'a3',
          label: 'Notify express customer dispatch time',
          type: 'task',
          actor: 'Dispatch Coordinator',
          tool: 'Email',
          time_min: 0,
          time_max: 1,
          next: ['a4'],
          edges: [{ to: 'a4', label: '' }],
          automation: {
            type: 'status_notification',
            description: 'Sends tracking code when express parcel label prints.',
            function: 'Customer tracking notice',
            trigger: 'Express courier label created',
            input: 'Tracking number, customer email',
            action: 'Send tracking update email',
            exception_route: 'Log failed delivery notice for Support',
            owner: 'Dispatch Coordinator',
            human_checkpoint: 'none',
          },
          from: ['r4'],
        },
        {
          id: 'a4',
          label: 'Generate daily fulfilment summary report',
          type: 'task',
          actor: 'Operations Manager',
          tool: 'Tracker',
          time_min: 2,
          time_max: 4,
          next: ['a5'],
          edges: [{ to: 'a5', label: '' }],
          automation: {
            type: 'dashboard_or_report',
            description: 'Compiles packed vs delayed order counts at daily cutoff.',
            function: 'Daily dispatch summary',
            trigger: 'Daily cutoff at 4pm',
            input: 'Dispatched and exception order statuses',
            action: 'Post end-of-day summary row',
            exception_route: 'Alert Operations Manager if backlog exceeds threshold',
            owner: 'Operations Manager',
            human_checkpoint: 'Operations Manager reviews late exceptions before home time',
          },
          from: ['r5'],
        },
        {
          id: 'a5',
          label: 'Order dispatched',
          type: 'end',
          actor: 'Dispatch Coordinator',
          tool: 'Warehouse Sheet',
          time_min: null,
          time_max: null,
          next: [],
          edges: [],
          automation: {
            type: 'status_notification',
            description: 'Marks dispatch lifecycle complete.',
            function: 'Complete marker',
            trigger: 'Manifest closed',
            input: 'Order status',
            action: 'Mark dispatched',
            exception_route: 'Escalate uncollected parcels',
            owner: 'Dispatch Coordinator',
            human_checkpoint: 'none',
          },
          from: ['r6'],
        },
      ],
      not_automated: [
        {
          step: 'r4',
          reason: 'Damaged stock replacements require warehouse lead sign-off.',
        },
      ],
    },
    automation_opportunities: [
      {
        name: 'Sync storefront orders straight into pick queue',
        effort: 'low',
        impact: 'high',
        step_ids: ['r1'],
        verdict: 'worth_it_now',
        why_this_volume: 'At 40+ daily orders, removing manual copy-paste saves hours every week.',
        revisit_when: null,
      },
    ],
    crm_tags: {
      industry: 'E-Commerce',
      process_code: 'EC-01',
      readiness_band: 'Fragile',
      top_bottleneck_bridge_letter: 'I',
      volume_band: 'high',
    },
  };
}

function extractPdfTextWithGhostscript(pdfBuffer: Buffer, tag: string): string {
  fs.mkdirSync('/tmp/clarity-map-review', { recursive: true });
  const pdfPath = `/tmp/clarity-map-review/${tag}.pdf`;
  const txtPath = `/tmp/clarity-map-review/${tag}.txt`;
  fs.writeFileSync(pdfPath, pdfBuffer);
  execFileSync('gs', ['-q', '-dNOPAUSE', '-dBATCH', '-sDEVICE=txtwrite', `-sOutputFile=${txtPath}`, pdfPath]);
  return fs.readFileSync(txtPath, 'utf8');
}

test('Process library loads all 12 industries and 48 unique processes cleanly', () => {
  const industries = getIndustries();
  assert.equal(industries.length, 12);

  const allProcesses = getAllProcesses();
  assert.equal(allProcesses.length, 48);

  const codes = new Set(allProcesses.map((p) => p.process_code));
  assert.equal(codes.size, 48, 'Every process must have a unique process_code');

  for (const ind of industries) {
    assert.equal(getProcessesByIndustry(ind.id).length, 4);
  }

  const healthcare = industries.find((i) => i.id === 'healthcare-clinics');
  const financial = industries.find((i) => i.id === 'financial-services');
  assert.equal(healthcare?.regulated, true);
  assert.equal(financial?.regulated, true);
});

test('Common questions evaluate dynamic C1b phrasing and conditional follow-ups (C3_master, C_approval_who)', () => {
  const proc = getAllProcesses()[0];
  assert.ok(getCommonQuestions().length >= 10);

  const baseAnswers: Record<string, QuestionAnswerValue> = {
    C1: { qid: 'C1', question: 'Frequency', stage: 'Frequency & Roles', answer: 'Weekly' },
    C3: { qid: 'C3', question: 'Tools', stage: 'Tools & Information', answer: ['Spreadsheet', 'Email'] },
    C4: { qid: 'C4', question: 'Delays', stage: 'Friction & Time', answer: ['Approval delay', 'Waiting for information'] },
  };

  const visible = getVisibleQuestions(proc, baseAnswers);
  const visibleQids = new Set(visible.map((q) => q.qid));
  assert.ok(visibleQids.has('C3_master'));
  assert.ok(visibleQids.has('C_approval_who'));

  const c1b = visible.find((q) => q.qid === 'C1b');
  assert.ok(c1b);
  assert.equal(getQuestionDisplayText(c1b, baseAnswers), 'Roughly how many times does it happen per week?');
});

test('Volume context computation maps weekly, monthly, per-project, and seasonal inputs accurately', () => {
  assert.equal(VOLUME_BAND_LOW_MAX, 10);
  assert.equal(VOLUME_BAND_HIGH_MIN, 30);

  const lowWeekly = computeVolumeContext([
    { qid: 'C1', answer: 'Weekly' },
    { qid: 'C1b', answer: '4–10 times' }, // Wait: max=10 -> medium
  ]);
  assert.deepEqual(lowWeekly, { runs_per_week: { min: 4, max: 10 }, volume_band: 'medium', basis: 'weekly' });

  const strictlyLow = computeVolumeContext([
    { qid: 'C1', answer: 'Weekly' },
    { qid: 'C1b', answer: '1–3 times' },
  ]);
  assert.deepEqual(strictlyLow, { runs_per_week: { min: 1, max: 3 }, volume_band: 'low', basis: 'weekly' });

  const monthlyLow = computeVolumeContext([
    { qid: 'C1', answer: 'Monthly' },
    { qid: 'C1b', answer: '11–25 times' },
  ]);
  assert.equal(monthlyLow.basis, 'monthly');
  assert.equal(monthlyLow.volume_band, 'low');
  assert.ok(monthlyLow.runs_per_week && monthlyLow.runs_per_week.max < 10);

  const highWeekly = computeVolumeContext([
    { qid: 'C1', answer: 'Daily' },
    { qid: 'C1b', answer: '50+ times' },
  ]);
  assert.equal(highWeekly.volume_band, 'high');
  assert.equal(highWeekly.basis, 'weekly');

  const seasonal = computeVolumeContext([
    { qid: 'C1', answer: 'Seasonally' },
    { qid: 'C1b', answer: '11 to 25 per season' },
  ]);
  assert.deepEqual(seasonal, {
    runs_per_week: null,
    volume_band: 'unknown',
    basis: 'seasonal',
  });
});

test('Question registry covers every live question id and flag dictionary filters unknown tokens', () => {
  const allProcesses = getAllProcesses();
  const commonQuestions = getCommonQuestions();
  const totalExpected = commonQuestions.length + allProcesses.reduce((s, p) => s + p.questions.length, 0);

  assert.ok(Object.keys(QUESTION_LABEL_REGISTRY).length >= totalExpected);
  assert.equal(getQuestionLabel('RE03_Q1'), 'How requests arrive');
  assert.equal(getQuestionLabel('RE03_Q2'), 'How urgency is decided');
  assert.equal(getQuestionLabel('C1'), 'How often it runs');
  assert.equal(getQuestionLabel('NON_EXISTENT_Q99'), 'your answers');

  for (const proc of allProcesses) {
    for (const q of proc.questions) {
      assert.ok(QUESTION_LABEL_REGISTRY[q.qid], `Missing label for ${q.qid}`);
    }
  }

  assert.deepEqual(resolveEvidenceLabels(['RE03_Q1', 'RE03_Q2', 'RE03_Q1']), [
    'How requests arrive',
    'How urgency is decided',
  ]);

  const resolvedFlags = resolvePainFlagLabels(['single_person_dependency', 'no_record', 'unknown_flag_xyz']);
  assert.deepEqual(resolvedFlags, ['Depends on one person', 'No written record']);
});

test('PII sanitization strips email addresses and phone numbers before AI analysis', () => {
  const cleaned = sanitizeAnswerText('We email john.doe@example.com or WhatsApp +1 (555) 234-5678 manually.');
  assert.ok(!cleaned.includes('john.doe@example.com'));
  assert.ok(cleaned.includes('[redacted email]'));
  assert.ok(cleaned.includes('[redacted number]'));

  const subCheck = sanitizeSubmission({
    industry: 'Retail',
    industry_id: 'retail',
    process_code: 'RT-01',
    process_name: 'Supplier Reorder',
    questionnaire_version: '1.0',
    answers: [
      {
        qid: 'C10',
        question: 'Anything else?',
        answer: 'Call 08012345678 or write manager@store.co',
        time_range: null,
      },
    ],
  });
  assert.equal(subCheck.redactedPII, true);
});

test('Schema v1 backward compatibility & Schema v2 validation (branches, volume gate, roadmap, leaks)', async () => {
  // 1. v1 record still validates and generates PDF cleanly
  const v1 = makeLegacyV1Result();
  const v1Outcome = validateClarityMapAnalysis(v1);
  assert.equal(v1Outcome.valid, true, `v1 validation failed: ${v1Outcome.errors.join('; ')}`);
  assert.equal(v1Outcome.data?.current_state.nodes[2].inferred, true, 'Empty evidence auto-marks inferred');
  const v1Pdf = await generateClarityMapPdf(v1Outcome.data!);
  assert.equal(v1Pdf.subarray(0, 5).toString('utf8'), '%PDF-');

  // 2. RE-03 v2 fixture validates with low volume context
  const re03 = makeRe03V2Fixture();
  const re03Outcome = validateClarityMapAnalysis(re03, {
    strictV2: true,
    volumeContext: { runs_per_week: { min: 4, max: 8 }, volume_band: 'low', basis: 'weekly' },
  });
  assert.equal(re03Outcome.valid, true, `RE-03 v2 failed: ${re03Outcome.errors.join('; ')}`);

  // 3. Seasonal / not_yet fixture enforces Stage 3 hours === Stage 2 hours
  const notYet = makeSeasonalNotYetFixture();
  const notYetOutcome = validateClarityMapAnalysis(notYet, {
    strictV2: true,
    volumeContext: { runs_per_week: null, volume_band: 'unknown', basis: 'seasonal' },
  });
  assert.equal(notYetOutcome.valid, true, `not_yet v2 failed: ${notYetOutcome.errors.join('; ')}`);
  assert.deepEqual(
    notYetOutcome.data?.time_estimate.hours_per_week.automated,
    notYetOutcome.data?.time_estimate.hours_per_week.redesigned
  );

  // 4. High volume E-Commerce fixture allows > 2 automations (up to 5)
  const highVol = makeHighVolumeEcommerceFixture();
  const highOutcome = validateClarityMapAnalysis(highVol, {
    strictV2: true,
    volumeContext: { runs_per_week: { min: 40, max: 60 }, volume_band: 'high', basis: 'daily' as any },
  });
  assert.equal(highOutcome.valid, true, `high volume v2 failed: ${highOutcome.errors.join('; ')}`);

  // 5. Volume gate rejects disallowed automation type & high impact at low volume
  const badLowVol = makeHighVolumeEcommerceFixture();
  const badLowOutcome = validateClarityMapAnalysis(badLowVol, {
    strictV2: true,
    volumeContext: { runs_per_week: { min: 2, max: 5 }, volume_band: 'low', basis: 'weekly' },
  });
  assert.equal(badLowOutcome.valid, false);
  assert.ok(badLowOutcome.errors.some((e) => e.includes('at most 2 automated steps')));
  assert.ok(badLowOutcome.errors.some((e) => e.includes('not permitted')));
  assert.ok(badLowOutcome.errors.some((e) => e.includes('maximum is "medium"')));

  // 6. Decision node with <2 edges or empty edge label fails
  const badDecision = makeRe03V2Fixture();
  badDecision.current_state.nodes[1].edges = [{ to: 'c4', label: '' }];
  const badDecisionOutcome = validateClarityMapAnalysis(badDecision, { strictV2: true });
  assert.equal(badDecisionOutcome.valid, false);
  assert.ok(badDecisionOutcome.errors.some((e) => e.includes('at least 2 outgoing edges')));
  assert.ok(badDecisionOutcome.errors.some((e) => e.includes('empty label')));

  // 7. Dead end / trapped cycle node fails reachability to end
  const deadEnd = makeRe03V2Fixture();
  deadEnd.current_state.nodes[4].edges = [{ to: 'c5', label: '' }]; // stops reaching c7 end
  const deadEndOutcome = validateClarityMapAnalysis(deadEnd, { strictV2: true });
  assert.equal(deadEndOutcome.valid, false);
  assert.ok(deadEndOutcome.errors.some((e) => e.includes('cannot reach an "end" node')));

  // 8. Week 1 missing baseline or Week 4 setting first-time baseline fails
  const badRoadmap = makeRe03V2Fixture();
  badRoadmap.implementation_order[0].includes_baseline = false;
  badRoadmap.implementation_order[3].actions = ['Measure your baseline time across the next 5 runs'];
  const badRoadmapOutcome = validateClarityMapAnalysis(badRoadmap, { strictV2: true });
  assert.equal(badRoadmapOutcome.valid, false);
  assert.ok(badRoadmapOutcome.errors.some((e) => e.includes('includes_baseline must be true')));
  assert.ok(badRoadmapOutcome.errors.some((e) => e.includes('first-time baseline')));

  // 9. Leak scan catches step id, question id, common id, and snake_case token
  const leaky = makeRe03V2Fixture();
  leaky.bottlenecks[0].title = 'Waiting on c3 from RE03_Q4 or C4 due to no_record';
  const leakyOutcome = validateClarityMapAnalysis(leaky, { strictV2: true });
  assert.equal(leakyOutcome.valid, false);
  assert.ok(leakyOutcome.errors.some((e) => e.includes('internal token')));
});

test('Shared presenter handles step numbering, replaces text, inferred legend, and null time hiding', () => {
  const re03 = makeRe03V2Fixture();
  assert.equal(stageHasInferredNodes(re03, 'current'), true);
  assert.equal(hasAnyTimeData(re03), true);

  const layout = computeWorkflowLayout(re03.current_state.nodes);
  assert.ok(layout.startMarker);
  assert.ok(layout.edges.some((e) => e.label === 'Routine spend check'));
  assert.equal(formatStepReferences(['c2', 'c4', 'c5'], layout.stepNumbers), 'Steps 2, 4, 5');
  assert.equal(formatReplacesTodayText(['c1'], layout.stepNumbers), 'Replaces step 1 (Today)');

  const noInfer = makeHighVolumeEcommerceFixture();
  assert.equal(stageHasInferredNodes(noInfer, 'current'), false);

  const nullTimes = makeSeasonalNotYetFixture();
  nullTimes.time_estimate.runs_per_week = { min: null, max: null };
  nullTimes.time_estimate.hours_per_week.current = { min: null, max: null };
  nullTimes.time_estimate.hours_per_week.redesigned = { min: null, max: null };
  nullTimes.time_estimate.hours_per_week.automated = { min: null, max: null };
  assert.equal(hasAnyTimeData(nullTimes), false);
  assert.equal(getAutomatedStageStatus(nullTimes), 'not_yet');
});

test('PDF outputs for RE-03, not_yet, null-times, and high-volume EC-01 contain zero leaks, hide nulls, export /tmp review PNGs, and stay <= 6 pages with >= 25% page fill', async () => {
  const outDir = '/tmp/clarity-map-review';
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(outDir)) {
    if (f.endsWith('.ppm') || f.startsWith('re03-page-')) fs.unlinkSync(path.join(outDir, f));
  }

  function assertPageCountAndFill(pdfPath: string, prefix: string) {
    execFileSync('gs', [
      '-q',
      '-dNOPAUSE',
      '-dBATCH',
      '-sDEVICE=ppmraw',
      '-r72',
      `-sOutputFile=${path.join(outDir, `${prefix}-%02d.ppm`)}`,
      pdfPath,
    ]);

    const ppmPages = fs
      .readdirSync(outDir)
      .filter((f) => f.startsWith(`${prefix}-`) && f.endsWith('.ppm'))
      .sort();

    assert.ok(
      ppmPages.length >= 1 && ppmPages.length <= 6,
      `${prefix}: Expected <= 6 pages, got ${ppmPages.length}`
    );

    for (const ppmFile of ppmPages) {
      const buf = fs.readFileSync(path.join(outDir, ppmFile));
      let pos = 0;
      const tokens: string[] = [];
      while (tokens.length < 4 && pos < buf.length) {
        while (pos < buf.length && (buf[pos] === 32 || buf[pos] === 10 || buf[pos] === 13 || buf[pos] === 9)) pos++;
        if (buf[pos] === 35) {
          while (pos < buf.length && buf[pos] !== 10) pos++;
          continue;
        }
        const start = pos;
        while (pos < buf.length && buf[pos] > 32) pos++;
        tokens.push(buf.subarray(start, pos).toString('ascii'));
      }
      pos++;
      const width = Number(tokens[1]);
      const height = Number(tokens[2]);
      const bodyHeight = Math.floor(height * 0.94);
      let minInkRow = bodyHeight;
      let maxInkRow = 0;
      let nonWhitePixels = 0;

      for (let y = 0; y < bodyHeight; y++) {
        let rowHasInk = false;
        for (let x = 0; x < width; x++) {
          const idx = pos + (y * width + x) * 3;
          if (buf[idx] < 252 || buf[idx + 1] < 252 || buf[idx + 2] < 252) {
            nonWhitePixels++;
            rowHasInk = true;
          }
        }
        if (rowHasInk) {
          if (y < minInkRow) minInkRow = y;
          if (y > maxInkRow) maxInkRow = y;
        }
      }

      const bodySpanFraction = (maxInkRow - minInkRow) / bodyHeight;
      const pixelRatio = nonWhitePixels / (width * bodyHeight);
      assert.ok(
        bodySpanFraction >= 0.25 && pixelRatio > 0.02,
        `Page ${ppmFile} is under-filled: bodySpan=${(bodySpanFraction * 100).toFixed(1)}%, nonWhitePixels=${(pixelRatio * 100).toFixed(2)}%`
      );
    }
    return ppmPages.length;
  }

  // A. Null-time + not_yet fixture PDF checks
  const nullNotYet = makeSeasonalNotYetFixture();
  nullNotYet.time_estimate.runs_per_week = { min: null, max: null };
  nullNotYet.time_estimate.hours_per_week.current = { min: null, max: null };
  nullNotYet.time_estimate.hours_per_week.redesigned = { min: null, max: null };
  nullNotYet.time_estimate.hours_per_week.automated = { min: null, max: null };
  const validNull = validateClarityMapAnalysis(nullNotYet, { strictV2: true });
  assert.ok(validNull.data);

  const nullPdf = await generateClarityMapPdf(validNull.data, { firstName: 'Sam' });
  const nullText = extractPdfTextWithGhostscript(nullPdf, 'ps01-not-yet-null');
  assert.ok(!nullText.includes('Not stated'), 'Null times must never render "Not stated"');
  assert.ok(!nullText.includes('Time not known'), 'Null times must never render "Time not known"');
  assert.ok(nullText.includes('Automation: not yet'));
  assert.ok(nullText.includes('The redesign already delivers the gain.'));
  assert.ok(nullText.includes('We need one number to estimate your time savings'));
  assert.ok(!nullText.includes('Dashed = we inferred'), 'No inferred legend when stage has no inferred nodes');
  assert.deepEqual(findReaderFacingLeaks(nullText), [], 'PS-01 PDF text must have zero leaked IDs or snake_case tokens');
  assertPageCountAndFill(path.join(outDir, 'ps01-not-yet-null.pdf'), 'ps01-page');

  // B. High-volume E-Commerce fixture PDF checks
  const ec01Valid = validateClarityMapAnalysis(makeHighVolumeEcommerceFixture(), {
    strictV2: true,
    volumeContext: { runs_per_week: { min: 40, max: 60 }, volume_band: 'high', basis: 'daily' as any },
  });
  assert.ok(ec01Valid.data);
  const ec01Pdf = await generateClarityMapPdf(ec01Valid.data, { firstName: 'Taylor' });
  const ec01Text = extractPdfTextWithGhostscript(ec01Pdf, 'ec01-high-vol');
  assert.deepEqual(findReaderFacingLeaks(ec01Text), [], 'EC-01 PDF text must have zero leaked IDs or snake_case tokens');
  assert.ok(!ec01Text.includes('Current Step Breakdown'));
  assert.ok(!ec01Text.includes('Evidence:'));
  assertPageCountAndFill(path.join(outDir, 'ec01-high-vol.pdf'), 'ec01-page');

  // C. RE-03 Full PDF check + render PNG pages to /tmp/clarity-map-review + verify page fill
  const re03Valid = validateClarityMapAnalysis(makeRe03V2Fixture(), {
    strictV2: true,
    volumeContext: { runs_per_week: { min: 4, max: 8 }, volume_band: 'low', basis: 'weekly' },
  });
  assert.ok(re03Valid.data);

  const re03Pdf = await generateClarityMapPdf(re03Valid.data, { firstName: 'Jordan' });
  const re03PdfRegen = await generateClarityMapPdf(re03Valid.data, { firstName: 'Jordan' });
  const re03Text = extractPdfTextWithGhostscript(re03Pdf, 're03-report');
  const re03RegenText = extractPdfTextWithGhostscript(re03PdfRegen, 're03-report-regen');

  assert.deepEqual(findReaderFacingLeaks(re03Text), [], 'RE-03 PDF text must have zero leaked IDs or snake_case tokens');
  assert.ok(re03Text.includes('OPERATIONAL READINESS'), 'PDF cover must use Operational Readiness label');
  assert.ok(!/Automation\s*(&|&amp;|and)?\s*Scale Readiness/i.test(re03Text), 'Old readiness label must not appear in PDF');
  assert.ok(!/Automation\s*(&|&amp;|and)?\s*Scale Readiness/i.test(nullText), 'Old readiness label must not appear in PS-01 PDF');
  assert.ok(!/Automation\s*(&|&amp;|and)?\s*Scale Readiness/i.test(ec01Text), 'Old readiness label must not appear in EC-01 PDF');
  assert.ok(re03Text.includes('KEY DIAGNOSTIC INSIGHT'), 'Cover hierarchy must include key diagnostic insight');
  assert.ok(re03Text.includes('MAIN IMPROVEMENT OPPORTUNITY'), 'Cover hierarchy must include main improvement opportunity');
  assert.ok(re03Text.includes('Dashed = we inferred this step'), 'Inferred legend must appear when Stage 1 has inferred step');
  assert.ok(re03Text.includes('What We Could Not See'));
  assert.ok(!re03Text.includes('Current Step Breakdown'), 'Current Step Breakdown section must be removed');
  assert.ok(!re03Text.includes('Evidence:'), 'Evidence lines must be dropped from PDF');

  const re03PdfPath = path.join(outDir, 're03-report.pdf');
  const re03Pages = assertPageCountAndFill(re03PdfPath, 're03-page');
  const regenPages = assertPageCountAndFill(path.join(outDir, 're03-report-regen.pdf'), 're03-regen-page');
  assert.equal(regenPages, re03Pages, 'Repeated PDF exports must produce the exact same page count');
  for (let p = 1; p <= re03Pages; p++) {
    assert.ok(re03Text.includes(`Page ${p} of ${re03Pages}`), `Missing footer "Page ${p} of ${re03Pages}"`);
    assert.ok(re03RegenText.includes(`Page ${p} of ${re03Pages}`), `Missing regen footer "Page ${p} of ${re03Pages}"`);
  }

  // Verify email template uses Operational Readiness consistently
  const emailSenderSource = fs.readFileSync(
    path.join(process.cwd(), 'server/clarity-map/email/sendReport.ts'),
    'utf8'
  );
  assert.ok(emailSenderSource.includes('Operational Readiness'));
  assert.ok(!/Automation\s*(&|&amp;|and)?\s*Scale Readiness/i.test(emailSenderSource));

  execFileSync('gs', [
    '-q',
    '-dNOPAUSE',
    '-dBATCH',
    '-sDEVICE=png16m',
    '-r150',
    `-sOutputFile=${path.join(outDir, 're03-page-%02d.png')}`,
    re03PdfPath,
  ]);

  const pngPages = fs
    .readdirSync(outDir)
    .filter((f) => f.startsWith('re03-page-') && f.endsWith('.png'))
    .sort();
  assert.equal(pngPages.length, re03Pages);
});

test('Readiness computation & Loops CRM error handling behave deterministically', async () => {
  const high = computeReadiness({
    B: { score: 4, finding: 'x', evidence: [] },
    R: { score: 3, finding: 'x', evidence: [] },
    I: { score: 3, finding: 'x', evidence: [] },
    D: { score: 3, finding: 'x', evidence: [] },
    G: { score: 3, finding: 'x', evidence: [] },
    E: { score: 2, finding: 'x', evidence: [] },
  });
  assert.equal(high.score_percent, 75);
  assert.equal(high.band, 'Ready to scale');

  const prevKey = process.env.LOOPS_API_KEY;
  delete process.env.LOOPS_API_KEY;
  const validated = validateClarityMapAnalysis(makeRe03V2Fixture(), { strictV2: true });
  assert.ok(validated.data);

  await assert.rejects(
    async () =>
      syncClarityMapContactToLoops({
        email: 'test@example.com',
        firstName: 'Alex',
        result: validated.data!,
      }),
    LoopsConfigurationError
  );

  const missingName = reportRequestSchema.safeParse({
    firstName: '',
    email: 'test@example.com',
    analysis: validated.data,
  });
  assert.equal(missingName.success, false);

  if (prevKey !== undefined) process.env.LOOPS_API_KEY = prevKey;
});

test('normalizeGeminiOutputForV2 normalizes missing v2 boilerplate and prevents unnecessary repair calls', () => {
  const raw = structuredClone(makeRe03V2Fixture()) as any;
  delete raw.schema_version;
  // Remove edges and terminal end nodes from current & redesigned stages
  raw.current_state.nodes = raw.current_state.nodes.slice(0, -1).map((n: any, idx: number, arr: any[]) => {
    const copy = { ...n };
    delete copy.edges;
    if (idx === arr.length - 1) copy.next = [];
    return copy;
  });
  raw.redesigned_state.nodes = raw.redesigned_state.nodes.slice(0, -1).map((n: any, idx: number, arr: any[]) => {
    const copy = { ...n };
    delete copy.edges;
    if (idx === arr.length - 1) copy.next = [];
    return copy;
  });
  raw.automated_state = {
    nodes: [],
    not_automated: raw.automated_state.not_automated,
  };
  raw.bridge_diagnosis.D.finding = 'No written record because of no_record and slow follow_up.';
  delete raw.implementation_order[0].includes_baseline;

  const submission = {
    industry: 'Real Estate',
    industry_id: 'real-estate',
    process_code: 'RE-03',
    process_name: 'Property maintenance request',
    questionnaire_version: '1.0.0',
    answers: [{ qid: 'C1', question: 'Frequency', answer: 'Weekly', time_range: null }],
  };
  const volumeContext = {
    runs_per_week: { min: 4, max: 8 },
    volume_band: 'low' as const,
    basis: 'weekly' as const,
  };

  const normalized = normalizeGeminiOutputForV2(raw, submission, volumeContext);
  const outcome = validateClarityMapAnalysis(normalized, { volumeContext, strictV2: true });
  assert.equal(outcome.valid, true, `Normalized output failed v2 validation: ${outcome.errors.join('; ')}`);
  assert.equal(outcome.data?.schema_version, 2);
  assert.equal(outcome.data?.automated_state.status, 'not_yet');
  assert.equal(outcome.data?.implementation_order[0].includes_baseline, true);
});

