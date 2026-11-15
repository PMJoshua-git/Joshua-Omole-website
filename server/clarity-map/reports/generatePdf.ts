import fs from 'node:fs';
import PDFDocument from 'pdfkit';
import type {
  AutomatedStateNode,
  BridgeLetter,
  ClarityMapResult,
  CurrentStateNode,
  RedesignedStateNode,
  WorkflowNodeType,
} from '../../../features/clarity-map/types/clarityMap';
import {
  AUTOMATION_TYPE_META,
  BRIDGE_LENS_META,
  CHANGE_TYPE_META,
  computeWorkflowLayout,
  PDF_LAYOUT_CONFIG,
  resolvePainFlagLabels,
  type GraphLayout,
  type LayoutConfig,
} from '../../../features/clarity-map/utils/diagramLayout';
import {
  formatNotAutomatedStepTitle,
  formatReplacesTodayText,
  formatStepReferences,
  getAutomatedStageStatus,
  getOptionalHoursLabel,
  getOptionalNodeTimeLabel,
  hasAnyTimeData,
  normalizeCurrentNodesForRender,
} from '../../../features/clarity-map/utils/clarityMapPresenter';

const COLORS = {
  sagePrimary: '#55745C',
  sageDark: '#405A46',
  sageSoft: '#EEF4EF',
  warmBg: '#FBFAF7',
  white: '#FFFFFF',
  surface2: '#F4F5F2',
  textMain: '#202A24',
  textSec: '#4E5851',
  textMuted: '#657068',
  border: '#C9D3CB',
  blue: '#2563EB',
  blueSoft: '#EFF6FF',
  amberBg: '#FEF3C7',
  amberBorder: '#D97706',
  amberText: '#92400E',
  redBg: '#FEE2E2',
  redText: '#991B1B',
  slateBorder: '#64748B',
  slateBg: '#F8FAFC',
};

const NOTO_REGULAR = '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf';
const NOTO_BOLD = '/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf';
const NOTO_ITALIC = '/usr/share/fonts/truetype/noto/NotoSans-Italic.ttf';
const HAS_NOTO_FONTS =
  fs.existsSync(NOTO_REGULAR) && fs.existsSync(NOTO_BOLD) && fs.existsSync(NOTO_ITALIC);

const FONT_REGULAR = HAS_NOTO_FONTS ? 'BodyRegular' : 'Helvetica';
const FONT_BOLD = HAS_NOTO_FONTS ? 'BodyBold' : 'Helvetica-Bold';
const FONT_ITALIC = HAS_NOTO_FONTS ? 'BodyItalic' : 'Helvetica-Oblique';

const AUDIT_URL_BASE = 'https://joshuaomole.com/audit';
const AUDIT_URL_HEADER_CTA =
  'https://joshuaomole.com/audit?utm_source=clarity_map&utm_medium=pdf_report&utm_campaign=cover_cta';
const AUDIT_URL_FOOTER_CTA =
  'https://joshuaomole.com/audit?utm_source=clarity_map&utm_medium=pdf_report&utm_campaign=closing_cta';

function getMarginX(): number {
  return 40;
}

function getUsableWidth(doc: PDFKit.PDFDocument): number {
  return doc.page.width - getMarginX() * 2;
}

function getBottomLimit(doc: PDFKit.PDFDocument): number {
  return doc.page.height - 42;
}

function ensureSpace(doc: PDFKit.PDFDocument, neededHeight: number): void {
  if (doc.y + neededHeight > getBottomLimit(doc)) {
    doc.addPage();
  }
}

function drawSectionHeading(
  doc: PDFKit.PDFDocument,
  eyebrow: string,
  title: string,
  subtitle?: string,
  compactGap = false
): void {
  const x = getMarginX();
  const w = getUsableWidth(doc);
  ensureSpace(doc, subtitle ? 64 : 44);

  doc
    .font(FONT_BOLD)
    .fontSize(8.5)
    .fillColor(COLORS.sageDark)
    .text(eyebrow.toUpperCase(), x, doc.y, { width: w, characterSpacing: 0.9 });

  doc.moveDown(0.15);
  doc
    .font(FONT_BOLD)
    .fontSize(15.5)
    .fillColor(COLORS.textMain)
    .text(title, x, doc.y, { width: w });

  if (subtitle) {
    doc.moveDown(0.2);
    doc
      .font(FONT_REGULAR)
      .fontSize(10)
      .fillColor(COLORS.textSec)
      .text(subtitle, x, doc.y, { width: w, lineGap: 2 });
  }
  doc.moveDown(compactGap ? 0.35 : 0.55);
}

/**
 * Fits a top-to-bottom GraphLayout cleanly within (maxW, maxH) by adapting box sizes and gaps,
 * never shrinking rendered text below 8pt.
 */
function computePdfFittedLayout(
  nodes: Array<{
    id: string;
    type?: WorkflowNodeType;
    next: string[];
    edges?: Array<{ to: string; label: string }>;
  }>,
  maxW: number,
  maxH: number
): GraphLayout {
  let config: LayoutConfig = { ...PDF_LAYOUT_CONFIG };
  let layout = computeWorkflowLayout(nodes, config);

  if (layout.width > maxW) {
    const scaleX = maxW / layout.width;
    config = {
      ...config,
      nodeW: Math.max(114, Math.floor(config.nodeW * scaleX)),
      endW: Math.max(82, Math.floor(config.endW * scaleX)),
      colGap: Math.max(10, Math.floor(config.colGap * scaleX)),
      padX: Math.max(6, Math.floor(config.padX * scaleX)),
    };
    layout = computeWorkflowLayout(nodes, config);
  }

  if (layout.height > maxH) {
    const scaleY = maxH / layout.height;
    config = {
      ...config,
      nodeH: Math.max(42, Math.floor(config.nodeH * scaleY)),
      endH: Math.max(20, Math.floor(config.endH * scaleY)),
      rowGap: Math.max(11, Math.floor(config.rowGap * scaleY)),
      startH: Math.max(17, Math.floor(config.startH * scaleY)),
      startGap: Math.max(9, Math.floor(config.startGap * scaleY)),
      padY: Math.max(4, Math.floor(config.padY * scaleY)),
    };
    layout = computeWorkflowLayout(nodes, config);
  }

  return layout;
}

function drawArrowhead(
  doc: PDFKit.PDFDocument,
  tipX: number,
  tipY: number,
  fromX: number,
  fromY: number,
  color: string
): void {
  const angle = Math.atan2(tipY - fromY, tipX - fromX);
  const size = 5.5;
  const p1x = tipX - size * Math.cos(angle - Math.PI / 6);
  const p1y = tipY - size * Math.sin(angle - Math.PI / 6);
  const p2x = tipX - size * Math.cos(angle + Math.PI / 6);
  const p2y = tipY - size * Math.sin(angle + Math.PI / 6);

  doc.save();
  doc.fillColor(color).polygon([tipX, tipY], [p1x, p1y], [p2x, p2y]).fill();
  doc.restore();
}

function drawPdfFlowDiagram(
  doc: PDFKit.PDFDocument,
  stage: 'current' | 'redesigned' | 'automated',
  rawNodes: Array<CurrentStateNode | RedesignedStateNode | AutomatedStateNode>,
  maxH: number
): void {
  const startX = getMarginX();
  const usableW = getUsableWidth(doc);

  const nodes =
    stage === 'current'
      ? normalizeCurrentNodesForRender(rawNodes as CurrentStateNode[])
      : rawNodes;

  if (nodes.length === 0) {
    return;
  }

  const layout = computePdfFittedLayout(nodes, usableW - 12, maxH);
  const blockH = layout.height + 8;
  ensureSpace(doc, blockH + 40);

  const startDiagramY = doc.y;
  const originX = startX + Math.max(0, (usableW - layout.width) / 2);
  const originY = startDiagramY + 2;

  const lineColor =
    stage === 'automated'
      ? COLORS.blue
      : stage === 'redesigned'
      ? COLORS.sagePrimary
      : '#5F6A62';

  // Light subtle backdrop frame for diagram
  doc.save();
  doc
    .roundedRect(startX, doc.y, usableW, blockH, 8)
    .fillAndStroke('#F8FAF8', COLORS.border);
  doc.restore();

  // Start Marker
  if (layout.startMarker) {
    const sm = layout.startMarker;
    const smX = originX + sm.x;
    const smY = originY + sm.y;

    doc.save();
    doc
      .roundedRect(smX, smY, sm.width, sm.height, sm.height / 2)
      .fill(COLORS.sageDark);
    doc
      .font(FONT_BOLD)
      .fontSize(8.5)
      .fillColor(COLORS.white)
      .text('Start', smX, smY + Math.max(4, (sm.height - 9) / 2), {
        width: sm.width,
        align: 'center',
        lineBreak: false,
      });
    doc.restore();

    for (const targetId of sm.targetIds) {
      const tp = layout.positions[targetId];
      if (!tp) continue;
      const sx = smX + sm.width / 2;
      const sy = smY + sm.height;
      const ex = originX + tp.x + tp.width / 2;
      const ey = originY + tp.y;
      const midY = sy + (ey - sy) * 0.5;
      doc.save();
      doc
        .strokeColor(lineColor)
        .lineWidth(1.1)
        .moveTo(sx, sy)
        .bezierCurveTo(sx, midY, ex, midY, ex, ey - 3)
        .stroke();
      doc.restore();
      drawArrowhead(doc, ex, ey, ex, midY, lineColor);
    }
  }

  // Edges
  for (const edge of layout.edges) {
    const pts = edge.points.map(([px, py]) => [originX + px, originY + py] as [number, number]);
    if (pts.length < 2) continue;
    const stroke = edge.isBackEdge ? COLORS.amberBorder : lineColor;

    doc.save();
    doc.strokeColor(stroke).lineWidth(1.1);
    if (edge.isBackEdge) {
      doc.dash(4, { space: 3 });
    }
    doc.moveTo(pts[0][0], pts[0][1]);
    if (pts.length === 4) {
      doc.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]);
    } else {
      for (let i = 1; i < pts.length; i++) {
        doc.lineTo(pts[i][0], pts[i][1]);
      }
    }
    doc.stroke();
    doc.undash();
    doc.restore();

    const tip = pts[pts.length - 1];
    const ctrl = pts[pts.length - 2];
    drawArrowhead(doc, tip[0], tip[1], ctrl[0], ctrl[1], stroke);

    if (edge.label) {
      const lx = originX + edge.labelX;
      const ly = originY + edge.labelY;
      doc.font(FONT_BOLD).fontSize(8);
      const textW = Math.min(96, Math.max(26, doc.widthOfString(edge.label) + 10));
      const pillH = 13;
      doc.save();
      doc
        .roundedRect(lx - textW / 2, ly - pillH / 2, textW, pillH, 3)
        .fillAndStroke(edge.isBackEdge ? COLORS.amberBg : COLORS.white, edge.isBackEdge ? COLORS.amberBorder : COLORS.border);
      doc
        .font(FONT_BOLD)
        .fontSize(8)
        .fillColor(edge.isBackEdge ? COLORS.amberText : COLORS.textMain)
        .text(edge.label, lx - textW / 2 + 3, ly - 4, {
          width: textW - 6,
          align: 'center',
          lineBreak: false,
          ellipsis: true,
        });
      doc.restore();
    }
  }

  // Nodes
  for (const node of nodes) {
    const pos = layout.positions[node.id];
    if (!pos) continue;

    const nx = originX + pos.x;
    const ny = originY + pos.y;
    const nw = pos.width;
    const nh = pos.height;
    const cNode = stage === 'current' ? (node as CurrentStateNode) : null;
    const rNode = stage === 'redesigned' ? (node as RedesignedStateNode) : null;
    const aNode = stage === 'automated' ? (node as AutomatedStateNode) : null;

    if (node.type === 'end') {
      doc.save();
      doc
        .roundedRect(nx, ny, nw, nh, nh / 2)
        .lineWidth(1.3)
        .fillAndStroke(
          stage === 'automated' ? COLORS.blueSoft : COLORS.sageSoft,
          stage === 'automated' ? COLORS.blue : COLORS.sageDark
        );
      doc
        .font(FONT_BOLD)
        .fontSize(8.5)
        .fillColor(stage === 'automated' ? COLORS.blue : COLORS.sageDark)
        .text(node.label || 'End', nx + 6, ny + Math.max(4, (nh - 9) / 2), {
          width: nw - 12,
          align: 'center',
          lineBreak: false,
          ellipsis: true,
        });
      doc.restore();
      continue;
    }

    const isDecision = node.type === 'decision';
    const isWait = node.type === 'wait';
    const isInferred = Boolean(cNode?.inferred);

    let fill = COLORS.white;
    let stroke = COLORS.border;
    if (isInferred) {
      fill = '#FFFBEB';
      stroke = COLORS.amberBorder;
    } else if (isDecision) {
      fill = stage === 'automated' ? COLORS.blueSoft : '#F2F7F3';
      stroke = stage === 'automated' ? COLORS.blue : COLORS.sageDark;
    } else if (isWait) {
      fill = COLORS.slateBg;
      stroke = COLORS.slateBorder;
    } else if (stage === 'redesigned') {
      stroke = COLORS.sagePrimary;
    } else if (stage === 'automated') {
      stroke = COLORS.blue;
    }

    doc.save();
    doc.fillColor(fill).strokeColor(stroke).lineWidth(isDecision ? 1.4 : 1.0);
    if (isInferred || isWait) {
      doc.dash(4, { space: 2.5 });
    }

    if (isDecision) {
      const notch = 9;
      doc
        .polygon(
          [nx + notch, ny],
          [nx + nw - notch, ny],
          [nx + nw, ny + nh / 2],
          [nx + nw - notch, ny + nh],
          [nx + notch, ny + nh],
          [nx, ny + nh / 2]
        )
        .fillAndStroke();
    } else {
      doc.roundedRect(nx, ny, nw, nh, 5).fillAndStroke();
    }
    doc.undash();
    doc.restore();

    const innerPadX = isDecision ? 13 : 8;
    const innerW = nw - innerPadX * 2;
    const timeLabel = getOptionalNodeTimeLabel(node.time_min, node.time_max);
    const flagLabels = cNode ? resolvePainFlagLabels(cNode.pain_flags) : [];

    // Header row inside node: "Step N" + optional right tag (all >= 8pt)
    const stepPrefix = `Step ${pos.stepNumber}`;
    let rightTag = '';
    let rightTagColor = COLORS.textMuted;
    if (isInferred) {
      rightTag = 'Inferred';
      rightTagColor = COLORS.amberText;
    } else if (isDecision) {
      rightTag = 'Decision';
      rightTagColor = stage === 'automated' ? COLORS.blue : COLORS.sageDark;
    } else if (node.type === 'wait') {
      rightTag = 'Wait';
      rightTagColor = COLORS.slateBorder;
    } else if (node.type === 'handoff') {
      rightTag = 'Handoff';
      rightTagColor = COLORS.textSec;
    } else if (rNode) {
      rightTag = `${CHANGE_TYPE_META[rNode.change_type]?.label || rNode.change_type} · ${rNode.bridge_letter}`;
      rightTagColor = COLORS.sageDark;
    } else if (aNode) {
      rightTag = AUTOMATION_TYPE_META[aNode.automation.type]?.label || 'Automated';
      rightTagColor = COLORS.blue;
    }

    doc.save();
    doc
      .font(FONT_BOLD)
      .fontSize(8)
      .fillColor(COLORS.sageDark)
      .text(stepPrefix, nx + innerPadX, ny + 5, { width: 42, lineBreak: false });

    if (rightTag) {
      doc
        .font(FONT_BOLD)
        .fontSize(8)
        .fillColor(rightTagColor)
        .text(rightTag, nx + innerPadX + 38, ny + 5, {
          width: innerW - 38,
          align: 'right',
          lineBreak: false,
          ellipsis: true,
        });
    }

    // Node Title
    doc
      .font(FONT_BOLD)
      .fontSize(8.5)
      .fillColor(COLORS.textMain)
      .text(node.label, nx + innerPadX, ny + 15, {
        width: innerW,
        height: nh >= 56 ? 21 : 18,
        ellipsis: true,
      });

    // Bottom actor + time (only if time exists) or flag summary
    const bottomTextParts: string[] = [node.actor || 'Team'];
    if (timeLabel) bottomTextParts.push(timeLabel);
    if (flagLabels.length > 0 && nh >= 54) {
      bottomTextParts.push(flagLabels[0]);
    }

    doc
      .font(FONT_REGULAR)
      .fontSize(8)
      .fillColor(COLORS.textSec)
      .text(bottomTextParts.join(' · '), nx + innerPadX, ny + nh - 13, {
        width: innerW,
        lineBreak: false,
        ellipsis: true,
      });

    doc.restore();
  }

  doc.y = startDiagramY + blockH + 6;

  // One-line legend under map
  const hasInferred = Boolean(
    stage === 'current' && (nodes as CurrentStateNode[]).some((n) => n.inferred)
  );
  const hasAnyFlags = Boolean(
    stage === 'current' &&
      (nodes as CurrentStateNode[]).some((n) => resolvePainFlagLabels(n.pain_flags).length > 0)
  );

  const legendNotes: string[] = [];
  if (hasInferred) {
    legendNotes.push('Dashed = we inferred this step from your answers. Please confirm it.');
  }
  if (hasAnyFlags) {
    legendNotes.push('Highlighted notes mark recurring friction points from your answers.');
  }
  if (nodes.some((n) => n.type === 'decision')) {
    legendNotes.push('Diamonds indicate branching decisions with labelled routes.');
  }

  if (legendNotes.length > 0) {
    doc
      .font(FONT_ITALIC)
      .fontSize(8.5)
      .fillColor(COLORS.textSec)
      .text(legendNotes.join('  |  '), startX, doc.y, { width: usableW, lineGap: 1.5 });
    doc.moveDown(0.45);
  }
}

export async function generateClarityMapPdf(
  result: ClarityMapResult,
  opts?: { firstName?: string }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 38, bottom: 42, left: 40, right: 40 },
      bufferPages: true,
      info: {
        Title: `Clarity Map Report — ${result.meta.process_name}`,
        Author: 'Joshua Omole',
        Subject: `${result.meta.industry} Workflow Transformation (${result.meta.process_code})`,
      },
    });

    if (HAS_NOTO_FONTS) {
      doc.registerFont('BodyRegular', NOTO_REGULAR);
      doc.registerFont('BodyBold', NOTO_BOLD);
      doc.registerFont('BodyItalic', NOTO_ITALIC);
    }

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const startX = getMarginX();
    const pageW = getUsableWidth(doc);
    const currentNodes = normalizeCurrentNodesForRender(result.current_state.nodes);
    const currentLayout = computeWorkflowLayout(currentNodes, PDF_LAYOUT_CONFIG);
    const redesignedLayout = computeWorkflowLayout(result.redesigned_state.nodes, PDF_LAYOUT_CONFIG);
    const currentSteps = currentLayout.stepNumbers;
    const redesignedSteps = redesignedLayout.stepNumbers;

    const automationStatus = getAutomatedStageStatus(result);
    const showTimeBlock = hasAnyTimeData(result);
    const generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // ───────────────────────────────────────────────────────────────────────────
    // PAGE 1: EDITORIAL COVER PAGE (LEVELS 1–4)
    // ───────────────────────────────────────────────────────────────────────────
    // Top restrained sage accent bar
    doc.rect(0, 0, doc.page.width, 6).fill(COLORS.sagePrimary);

    // LEVEL 1 — Brand, Report Identity & Preparation Date
    const l1Y = 28;
    doc
      .font(FONT_BOLD)
      .fontSize(9)
      .fillColor(COLORS.sageDark)
      .text('JOSHUAOMOLE.COM · THE CLARITY MAP', startX, l1Y, {
        width: pageW * 0.62,
        characterSpacing: 1.0,
      });
    doc
      .font(FONT_REGULAR)
      .fontSize(9.5)
      .fillColor(COLORS.textSec)
      .text('Operational Workflow Diagnostic & Transformation Report', startX, l1Y + 13, {
        width: pageW * 0.62,
      });

    doc
      .font(FONT_BOLD)
      .fontSize(9.5)
      .fillColor(COLORS.textMain)
      .text(opts?.firstName ? `Prepared for ${opts.firstName}` : 'Client Diagnostic Report', startX + pageW * 0.62, l1Y, {
        width: pageW * 0.38,
        align: 'right',
      });
    doc
      .font(FONT_REGULAR)
      .fontSize(9.5)
      .fillColor(COLORS.textSec)
      .text(generatedDate, startX + pageW * 0.62, l1Y + 13, {
        width: pageW * 0.38,
        align: 'right',
      });

    doc
      .strokeColor(COLORS.border)
      .lineWidth(1)
      .moveTo(startX, l1Y + 33)
      .lineTo(startX + pageW, l1Y + 33)
      .stroke();

    // LEVEL 2 — Main Report Title (Process name dominant; industry & code secondary)
    const l2Y = l1Y + 48;
    doc
      .font(FONT_BOLD)
      .fontSize(9.5)
      .fillColor(COLORS.sageDark)
      .text(
        `${result.meta.industry.toUpperCase()}  ·  PROCESS REF ${result.meta.process_code}`,
        startX,
        l2Y,
        { width: pageW, characterSpacing: 0.9 }
      );

    doc.font(FONT_BOLD).fontSize(26);
    const titleH = doc.heightOfString(result.meta.process_name, { width: pageW, lineGap: 2 });
    doc
      .font(FONT_BOLD)
      .fontSize(26)
      .fillColor(COLORS.textMain)
      .text(result.meta.process_name, startX, l2Y + 16, {
        width: pageW,
        lineGap: 2,
      });

    const subtitleText =
      'Three-stage diagnostic across your current workflow, software-free redesign, and targeted automation.';
    doc
      .font(FONT_REGULAR)
      .fontSize(10.5)
      .fillColor(COLORS.textSec)
      .text(subtitleText, startX, l2Y + 22 + titleH, { width: pageW, lineGap: 2 });

    doc.font(FONT_REGULAR).fontSize(10.5);
    const subtitleH = doc.heightOfString(subtitleText, { width: pageW, lineGap: 2 });

    // LEVEL 3 — Diagnostic Result (Operational Readiness + Band + Confidence + Operating-System Framing)
    const cardY = l2Y + 22 + titleH + subtitleH + 18;
    const bandColor =
      result.readiness.band === 'Fragile'
        ? COLORS.redText
        : result.readiness.band === 'Developing'
        ? COLORS.amberText
        : COLORS.sageDark;

    const readinessNote =
      'Evaluates operating system maturity across process, roles, systems, data, governance, and continuous review. A lower score identifies which foundations to strengthen first — not that automation is impossible.';
    doc.font(FONT_REGULAR).fontSize(9.5);
    const noteH = doc.heightOfString(readinessNote, { width: pageW - 34, lineGap: 2 });
    const cardH = 88 + noteH;

    doc
      .roundedRect(startX, cardY, pageW, cardH, 8)
      .fillAndStroke(COLORS.surface2, COLORS.border);
    // Left vertical Sage accent strip inside card
    doc.rect(startX, cardY + 8, 4.5, cardH - 16).fill(COLORS.sagePrimary);

    const leftZoneW = pageW * 0.54;
    const rightZoneX = startX + leftZoneW + 14;
    const rightZoneW = pageW - leftZoneW - 28;

    doc
      .font(FONT_BOLD)
      .fontSize(8.5)
      .fillColor(COLORS.textMuted)
      .text('OPERATIONAL READINESS', startX + 18, cardY + 12, { characterSpacing: 0.9 });

    doc
      .font(FONT_BOLD)
      .fontSize(28)
      .fillColor(COLORS.textMain)
      .text(`${result.readiness.score_percent}%`, startX + 18, cardY + 25, { lineBreak: false });

    doc
      .font(FONT_BOLD)
      .fontSize(12)
      .fillColor(bandColor)
      .text(result.readiness.band, startX + 94, cardY + 34, { lineBreak: false });

    // Proportional progress bar
    const progW = leftZoneW - 26;
    doc.roundedRect(startX + 18, cardY + 60, progW, 5.5, 2.5).fill(COLORS.border);
    doc
      .roundedRect(startX + 18, cardY + 60, Math.max(8, (result.readiness.score_percent / 100) * progW), 5.5, 2.5)
      .fill(COLORS.sagePrimary);

    // Vertical divider inside card
    doc
      .strokeColor(COLORS.border)
      .lineWidth(0.75)
      .moveTo(startX + leftZoneW + 2, cardY + 12)
      .lineTo(startX + leftZoneW + 2, cardY + 68)
      .stroke();

    const formattedConfidence =
      result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1).toLowerCase();
    const currentHoursLabel = getOptionalHoursLabel(
      result.time_estimate.hours_per_week.current.min,
      result.time_estimate.hours_per_week.current.max,
      'hrs/week'
    );
    const opStepCount = result.current_state.nodes.filter((n) => n.type !== 'end').length;

    doc
      .font(FONT_BOLD)
      .fontSize(8.5)
      .fillColor(COLORS.textMuted)
      .text('DIAGNOSTIC SNAPSHOT', rightZoneX, cardY + 12, {
        width: rightZoneW,
        characterSpacing: 0.8,
      });

    doc
      .font(FONT_REGULAR)
      .fontSize(9.5)
      .fillColor(COLORS.textMain)
      .text(`Confidence: ${formattedConfidence}`, rightZoneX, cardY + 27, { width: rightZoneW });
    doc
      .font(FONT_REGULAR)
      .fontSize(9.5)
      .fillColor(COLORS.textMain)
      .text(
        currentHoursLabel
          ? `Current team effort: ${currentHoursLabel}`
          : `Mapped workflow scope: ${opStepCount} active steps`,
        rightZoneX,
        cardY + 42,
        { width: rightZoneW }
      );
    if (currentHoursLabel) {
      doc
        .font(FONT_REGULAR)
        .fontSize(9.5)
        .fillColor(COLORS.textSec)
        .text(`Mapped workflow scope: ${opStepCount} active steps`, rightZoneX, cardY + 57, {
          width: rightZoneW,
        });
    }

    // Horizontal divider & BRIDGE definition note inside card
    const cardDivY = cardY + 75;
    doc
      .strokeColor(COLORS.border)
      .lineWidth(0.75)
      .moveTo(startX + 18, cardDivY)
      .lineTo(startX + pageW - 14, cardDivY)
      .stroke();
    doc
      .font(FONT_REGULAR)
      .fontSize(9.5)
      .fillColor(COLORS.textSec)
      .text(readinessNote, startX + 18, cardDivY + 7, { width: pageW - 34, lineGap: 2 });

    doc.y = cardY + cardH + 22;

    // LEVEL 4 — Executive Summary (Situation, Key Insight, Main Improvement Opportunity)
    doc
      .font(FONT_BOLD)
      .fontSize(8.5)
      .fillColor(COLORS.sageDark)
      .text('EXECUTIVE SUMMARY', startX, doc.y, { width: pageW, characterSpacing: 0.9 });
    doc.moveDown(0.2);

    doc
      .font(FONT_BOLD)
      .fontSize(15)
      .fillColor(COLORS.textMain)
      .text(result.summary.headline, startX, doc.y, { width: pageW, lineGap: 2 });
    doc.moveDown(0.35);

    doc
      .font(FONT_REGULAR)
      .fontSize(10.2)
      .fillColor(COLORS.textMain)
      .text(result.summary.paragraph, startX, doc.y, { width: pageW, lineGap: 3 });
    doc.moveDown(0.7);

    // Side-by-side Cover Callouts: Most Important Diagnostic Insight + Main Improvement Opportunity
    const leadBottleneck = result.bottlenecks[0];
    const leadQuickWin = result.quick_wins[0];
    const leadRule = result.redesigned_state.rules_introduced[0];

    const colGap = 12;
    const calloutW = (pageW - colGap) / 2;
    const insightTitle = leadBottleneck ? leadBottleneck.title : 'Primary workflow constraint identified';
    const insightBody = leadBottleneck
      ? `${leadBottleneck.why_it_matters} (${formatStepReferences(leadBottleneck.step_ids, currentSteps)})`
      : 'See the Stage 1 map and BRIDGE breakdown on the following pages for full bottleneck details.';

    const oppTitle = leadQuickWin ? 'Start this week without new tools' : 'Focus on process redesign first';
    const oppBody = leadQuickWin
      ? `${leadQuickWin.action} (${leadQuickWin.time_to_do}${
          leadQuickWin.needs_new_software ? '' : ', zero new software'
        }).`
      : leadRule || 'Consolidate ownership and introduce clear decision rules before adding software.';

    doc.font(FONT_BOLD).fontSize(10);
    const inTitleH = doc.heightOfString(insightTitle, { width: calloutW - 24, lineGap: 1.5 });
    const oppTitleH = doc.heightOfString(oppTitle, { width: calloutW - 24, lineGap: 1.5 });
    doc.font(FONT_REGULAR).fontSize(10);
    const inBodyH = doc.heightOfString(insightBody, { width: calloutW - 24, lineGap: 2 });
    const oppBodyH = doc.heightOfString(oppBody, { width: calloutW - 24, lineGap: 2 });

    const calloutH = Math.max(inTitleH + inBodyH, oppTitleH + oppBodyH) + 38;
    const calloutY = doc.y;

    // Left callout — Key Diagnostic Insight
    doc
      .roundedRect(startX, calloutY, calloutW, calloutH, 6)
      .fillAndStroke(COLORS.white, COLORS.border);
    doc
      .font(FONT_BOLD)
      .fontSize(8)
      .fillColor(COLORS.amberText)
      .text('KEY DIAGNOSTIC INSIGHT', startX + 12, calloutY + 10, {
        width: calloutW - 24,
        characterSpacing: 0.7,
      });
    doc
      .font(FONT_BOLD)
      .fontSize(10)
      .fillColor(COLORS.textMain)
      .text(insightTitle, startX + 12, calloutY + 23, { width: calloutW - 24, lineGap: 1.5 });
    doc
      .font(FONT_REGULAR)
      .fontSize(10)
      .fillColor(COLORS.textSec)
      .text(insightBody, startX + 12, calloutY + 27 + inTitleH, {
        width: calloutW - 24,
        lineGap: 2,
      });

    // Right callout — Main Improvement Opportunity
    const rightColX = startX + calloutW + colGap;
    doc
      .roundedRect(rightColX, calloutY, calloutW, calloutH, 6)
      .fillAndStroke(COLORS.sageSoft, COLORS.sagePrimary);
    doc
      .font(FONT_BOLD)
      .fontSize(8)
      .fillColor(COLORS.sageDark)
      .text('MAIN IMPROVEMENT OPPORTUNITY', rightColX + 12, calloutY + 10, {
        width: calloutW - 24,
        characterSpacing: 0.7,
      });
    doc
      .font(FONT_BOLD)
      .fontSize(10)
      .fillColor(COLORS.textMain)
      .text(oppTitle, rightColX + 12, calloutY + 23, { width: calloutW - 24, lineGap: 1.5 });
    doc
      .font(FONT_REGULAR)
      .fontSize(10)
      .fillColor(COLORS.textMain)
      .text(oppBody, rightColX + 12, calloutY + 27 + oppTitleH, {
        width: calloutW - 24,
        lineGap: 2,
      });

    // Anchor Cover Audit Strip cleanly near the lower portion of the cover without overflowing bottom margin
    const coverBottomSafe = getBottomLimit(doc) - 62;
    const shortCtaY = Math.min(coverBottomSafe, Math.max(calloutY + calloutH + 18, coverBottomSafe - 16));
    doc
      .roundedRect(startX, shortCtaY, pageW, 48, 6)
      .fillAndStroke(COLORS.surface2, COLORS.border);
    doc
      .font(FONT_BOLD)
      .fontSize(10)
      .fillColor(COLORS.textMain)
      .text(
        'Want help walking through this map? Book a 30-minute Systems Clarity Audit',
        startX + 14,
        shortCtaY + 9,
        {
          width: pageW - 28,
          link: AUDIT_URL_HEADER_CTA,
        }
      );
    doc
      .font(FONT_BOLD)
      .fontSize(9.5)
      .fillColor(COLORS.sageDark)
      .text(AUDIT_URL_BASE, startX + 14, shortCtaY + 25, {
        width: pageW - 28,
        link: AUDIT_URL_HEADER_CTA,
        underline: true,
      });

    // ───────────────────────────────────────────────────────────────────────────
    // PAGE 2: STAGE 1 — YOUR PROCESS TODAY (FLOW DIAGRAM + WHAT WE COULD NOT SEE)
    // ───────────────────────────────────────────────────────────────────────────
    doc.addPage();
    drawSectionHeading(
      doc,
      'Stage 1 of 3',
      'Your Process Today',
      'How the work moves today, with friction points and unconfirmed handoffs marked directly on the map.',
      true
    );

    // Budget height so visibility gaps fit cleanly on Page 2
    let gapsEstimatedH = 0;
    if (result.current_state.visibility_gaps.length > 0) {
      doc.font(FONT_REGULAR).fontSize(10);
      gapsEstimatedH =
        34 +
        result.current_state.visibility_gaps.reduce(
          (acc, g) => acc + doc.heightOfString(`• ${g}`, { width: pageW - 16, lineGap: 2 }) + 5,
          0
        );
    }
    const page2MaxDiagramH = Math.max(210, getBottomLimit(doc) - doc.y - gapsEstimatedH - 72);
    drawPdfFlowDiagram(doc, 'current', currentNodes, page2MaxDiagramH);

    if (result.current_state.visibility_gaps.length > 0) {
      doc.moveDown(0.2);
      ensureSpace(doc, 60);
      doc
        .font(FONT_BOLD)
        .fontSize(11)
        .fillColor(COLORS.amberText)
        .text('What We Could Not See', startX, doc.y, { width: pageW });
      doc.moveDown(0.25);
      result.current_state.visibility_gaps.forEach((gap) => {
        doc.font(FONT_REGULAR).fontSize(10);
        const gh = doc.heightOfString(`• ${gap}`, { width: pageW - 10, lineGap: 2 });
        ensureSpace(doc, gh + 6);
        doc
          .font(FONT_REGULAR)
          .fontSize(10)
          .fillColor(COLORS.textMain)
          .text(`• ${gap}`, startX + 6, doc.y, { width: pageW - 10, lineGap: 2 });
        doc.moveDown(0.2);
      });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // PAGE 3: TOP 3 BOTTLENECKS + BRIDGE OPERATIONAL DIAGNOSIS (2×3 GRID)
    // ───────────────────────────────────────────────────────────────────────────
    doc.addPage();
    drawSectionHeading(
      doc,
      'Priority Friction',
      'Top 3 Operational Bottlenecks',
      undefined,
      true
    );
    result.bottlenecks.slice(0, 3).forEach((b, idx) => {
      const stepRefs = formatStepReferences(b.step_ids, currentSteps);
      const bodyText = `${b.why_it_matters} (${stepRefs})`;
      doc.font(FONT_BOLD).fontSize(10.5);
      const h1 = doc.heightOfString(`${idx + 1}. ${b.title} [BRIDGE: ${b.bridge_letter}]`, {
        width: pageW - 20,
      });
      doc.font(FONT_REGULAR).fontSize(10);
      const h2 = doc.heightOfString(bodyText, { width: pageW - 20, lineGap: 2 });
      const blockH = h1 + h2 + 16;

      ensureSpace(doc, blockH + 8);
      const by = doc.y;
      doc.roundedRect(startX, by, pageW, blockH, 5).fillAndStroke(COLORS.white, COLORS.border);
      doc
        .font(FONT_BOLD)
        .fontSize(10.5)
        .fillColor(COLORS.textMain)
        .text(`${idx + 1}. ${b.title} [BRIDGE: ${b.bridge_letter}]`, startX + 10, by + 7, {
          width: pageW - 20,
        });
      doc
        .font(FONT_REGULAR)
        .fontSize(10)
        .fillColor(COLORS.textSec)
        .text(bodyText, startX + 10, by + 10 + h1, {
          width: pageW - 20,
          lineGap: 2,
        });
      doc.y = by + blockH + 7;
    });

    doc.moveDown(0.45);
    drawSectionHeading(
      doc,
      'BRIDGE Methodology',
      'Operational Diagnosis Across 6 Lenses',
      'Each lens is scored from 0 (absent or unknown) to 4 (measured and reviewed on a schedule).',
      true
    );

    const bridgePairs: Array<[BridgeLetter, BridgeLetter]> = [
      ['B', 'R'],
      ['I', 'D'],
      ['G', 'E'],
    ];
    const bridgeColGap = 10;
    const bridgeColW = (pageW - bridgeColGap) / 2;

    bridgePairs.forEach(([leftKey, rightKey]) => {
      const pair = [leftKey, rightKey].map((letter) => {
        const lens = result.bridge_diagnosis[letter];
        const meta = BRIDGE_LENS_META[letter];
        doc.font(FONT_REGULAR).fontSize(10);
        const fH = doc.heightOfString(lens.finding, { width: bridgeColW - 20, lineGap: 1.8 });
        return { letter, lens, meta, cardH: Math.max(82, 46 + fH) };
      });

      const rowH = Math.max(pair[0].cardH, pair[1].cardH);
      ensureSpace(doc, rowH + 8);
      const rowY = doc.y;

      pair.forEach((item, colIdx) => {
        const cx = startX + colIdx * (bridgeColW + bridgeColGap);
        doc
          .roundedRect(cx, rowY, bridgeColW, rowH, 6)
          .fillAndStroke(COLORS.white, COLORS.border);

        doc
          .font(FONT_BOLD)
          .fontSize(10)
          .fillColor(COLORS.sageDark)
          .text(`${item.letter} — ${item.meta.name}`, cx + 10, rowY + 9, {
            width: bridgeColW - 58,
            lineBreak: false,
            ellipsis: true,
          });
        doc
          .font(FONT_BOLD)
          .fontSize(10)
          .fillColor(COLORS.textMain)
          .text(`${item.lens.score} / 4`, cx + bridgeColW - 48, rowY + 9, {
            width: 38,
            align: 'right',
            lineBreak: false,
          });

        const barW = bridgeColW - 20;
        const fillW = Math.max(6, (item.lens.score / 4) * barW);
        doc.rect(cx + 10, rowY + 25, barW, 4).fill(COLORS.surface2);
        doc.rect(cx + 10, rowY + 25, fillW, 4).fill(COLORS.sagePrimary);

        doc
          .font(FONT_REGULAR)
          .fontSize(10)
          .fillColor(COLORS.textMain)
          .text(item.lens.finding, cx + 10, rowY + 35, {
            width: bridgeColW - 20,
            lineGap: 1.8,
          });
      });

      doc.y = rowY + rowH + 8;
    });

    // ───────────────────────────────────────────────────────────────────────────
    // PAGE 4: STAGE 2 — IMPROVED FIRST (DIAGRAM + WHAT CHANGES + RULES + REMOVED)
    // ───────────────────────────────────────────────────────────────────────────
    doc.addPage();
    drawSectionHeading(
      doc,
      'Stage 2 of 3',
      'Improved Process Without New Software',
      'Operational improvements applied first using tools your business already has.',
      true
    );

    const changedNodes = redesignedLayout.orderedNodeIds
      .map((id) => result.redesigned_state.nodes.find((n) => n.id === id))
      .filter(
        (n): n is RedesignedStateNode =>
          Boolean(n && n.type !== 'end' && n.change_type !== 'unchanged')
      );

    // Budget space below diagram so Stage 2 fits cleanly on Page 4 without stub overflow
    doc.font(FONT_REGULAR).fontSize(10);
    const changesEstH =
      changedNodes.length > 0
        ? 24 +
          changedNodes.reduce((acc, n) => {
            const stepNum = redesignedSteps[n.id];
            const repText = formatReplacesTodayText(n.replaces, currentSteps);
            const line = `• Step ${stepNum} (${n.label}): ${n.rationale} (${repText})`;
            return acc + doc.heightOfString(line, { width: pageW - 12, lineGap: 1.5 }) + 4;
          }, 0)
        : 0;
    const rulesEstH =
      result.redesigned_state.rules_introduced.length > 0
        ? 22 +
          result.redesigned_state.rules_introduced.reduce(
            (acc, r) => acc + doc.heightOfString(`• ${r}`, { width: pageW - 12, lineGap: 1.5 }) + 3,
            0
          )
        : 0;
    const removedEstH =
      result.redesigned_state.removed.length > 0
        ? 22 +
          result.redesigned_state.removed.reduce((acc, rem) => {
            const rep = formatStepReferences(rem.replaces, currentSteps);
            return (
              acc +
              doc.heightOfString(`• ${rep} removed: ${rem.reason}`, {
                width: pageW - 12,
                lineGap: 1.5,
              }) +
              3
            );
          }, 0)
        : 0;

    const totalStage2NotesH = changesEstH + rulesEstH + removedEstH + 74;
    const page4MaxDiagramH = Math.max(195, getBottomLimit(doc) - doc.y - totalStage2NotesH);
    drawPdfFlowDiagram(doc, 'redesigned', result.redesigned_state.nodes, page4MaxDiagramH);

    if (changedNodes.length > 0) {
      ensureSpace(doc, 38);
      doc
        .font(FONT_BOLD)
        .fontSize(10.5)
        .fillColor(COLORS.textMain)
        .text('What Changes and Why', startX, doc.y, { width: pageW });
      doc.moveDown(0.2);

      changedNodes.forEach((node) => {
        const stepNum = redesignedSteps[node.id];
        const repText = formatReplacesTodayText(node.replaces, currentSteps);
        const line = `• Step ${stepNum} (${node.label}): ${node.rationale} (${repText})`;
        doc.font(FONT_REGULAR).fontSize(10);
        const lh = doc.heightOfString(line, { width: pageW - 10, lineGap: 1.5 });
        ensureSpace(doc, lh + 4);
        doc
          .font(FONT_REGULAR)
          .fontSize(10)
          .fillColor(COLORS.textMain)
          .text(line, startX + 6, doc.y, { width: pageW - 10, lineGap: 1.5 });
        doc.moveDown(0.15);
      });
      doc.moveDown(0.3);
    }

    if (result.redesigned_state.rules_introduced.length > 0) {
      ensureSpace(doc, 36);
      doc
        .font(FONT_BOLD)
        .fontSize(10.5)
        .fillColor(COLORS.textMain)
        .text('Operating Rules Introduced', startX, doc.y, { width: pageW });
      doc.moveDown(0.2);
      result.redesigned_state.rules_introduced.forEach((rule) => {
        doc.font(FONT_REGULAR).fontSize(10);
        const rh = doc.heightOfString(`• ${rule}`, { width: pageW - 10, lineGap: 1.5 });
        ensureSpace(doc, rh + 4);
        doc
          .font(FONT_REGULAR)
          .fontSize(10)
          .fillColor(COLORS.textSec)
          .text(`• ${rule}`, startX + 6, doc.y, { width: pageW - 10, lineGap: 1.5 });
        doc.moveDown(0.12);
      });
      doc.moveDown(0.3);
    }

    if (result.redesigned_state.removed.length > 0) {
      ensureSpace(doc, 36);
      doc
        .font(FONT_BOLD)
        .fontSize(10.5)
        .fillColor(COLORS.textMain)
        .text('Removed Activities', startX, doc.y, { width: pageW });
      doc.moveDown(0.2);
      result.redesigned_state.removed.forEach((rem) => {
        const ref = formatStepReferences(rem.replaces, currentSteps);
        const line = `• ${ref} (Today) removed — ${rem.reason}`;
        doc.font(FONT_REGULAR).fontSize(10);
        const lh = doc.heightOfString(line, { width: pageW - 10, lineGap: 1.5 });
        ensureSpace(doc, lh + 4);
        doc
          .font(FONT_REGULAR)
          .fontSize(10)
          .fillColor(COLORS.textSec)
          .text(line, startX + 6, doc.y, { width: pageW - 10, lineGap: 1.5 });
        doc.moveDown(0.12);
      });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // PAGE 5: STAGE 3 — AUTOMATION (MAP OR NOT_YET CARD + TABLE + MANUAL LIST)
    // ───────────────────────────────────────────────────────────────────────────
    doc.addPage();
    drawSectionHeading(
      doc,
      'Stage 3 of 3',
      'Targeted Automation Opportunities',
      automationStatus === 'limited'
        ? 'Only these steps are worth automating at your volume.'
        : automationStatus === 'not_yet'
        ? 'Automation posture based on your current run volume.'
        : 'Safe, rule-based automation layered on top of the redesigned workflow.',
      true
    );

    if (automationStatus === 'not_yet') {
      const reasonText =
        result.automated_state.reason ||
        'At your current volume, redesigning steps and ownership brings the improvement without adding software complexity.';
      const revisitText = result.automated_state.revisit_when || '';

      doc.font(FONT_REGULAR).fontSize(10);
      const rH = doc.heightOfString(reasonText, { width: pageW - 28, lineGap: 2.5 });
      const rvH = revisitText
        ? doc.heightOfString(`When to revisit: ${revisitText}`, { width: pageW - 28, lineGap: 2 })
        : 0;
      const cardH = 66 + rH + rvH;
      const boxY = doc.y;

      doc.roundedRect(startX, boxY, pageW, cardH, 8).fillAndStroke(COLORS.sageSoft, COLORS.sagePrimary);
      doc
        .font(FONT_BOLD)
        .fontSize(13)
        .fillColor(COLORS.textMain)
        .text('Automation: not yet', startX + 14, boxY + 14, { width: pageW - 28 });
      doc
        .font(FONT_BOLD)
        .fontSize(10.5)
        .fillColor(COLORS.sageDark)
        .text('The redesign already delivers the gain.', startX + 14, boxY + 34, {
          width: pageW - 28,
        });
      doc
        .font(FONT_REGULAR)
        .fontSize(10)
        .fillColor(COLORS.textMain)
        .text(reasonText, startX + 14, boxY + 52, { width: pageW - 28, lineGap: 2.5 });
      if (revisitText) {
        doc
          .font(FONT_BOLD)
          .fontSize(10)
          .fillColor(COLORS.sageDark)
          .text(`When to revisit: ${revisitText}`, startX + 14, boxY + 58 + rH, {
            width: pageW - 28,
            lineGap: 2,
          });
      }
      doc.y = boxY + cardH + 14;
    } else {
      const autoOps = result.automated_state.nodes.filter((n) => n.type !== 'end');

      // Estimate table + manual list height to size Stage 3 diagram cleanly
      const colWidths = [
        pageW * 0.19,
        pageW * 0.18,
        pageW * 0.27,
        pageW * 0.18,
        pageW * 0.18,
      ];
      doc.font(FONT_REGULAR).fontSize(8.5);
      const tableEstH =
        28 +
        autoOps.reduce((acc, n) => {
          const inputAction = [n.automation.input, n.automation.action]
            .filter(Boolean)
            .join(' → ') || n.automation.description;
          const cells = [
            n.label,
            n.automation.trigger || n.automation.function || 'Workflow event',
            inputAction,
            n.automation.exception_route || 'Escalate to owner',
            n.automation.human_checkpoint,
          ];
          const rowH =
            Math.max(
              ...cells.map((txt, idx) =>
                doc.heightOfString(txt, { width: colWidths[idx] - 10, lineGap: 1.5 })
              )
            ) + 12;
          return acc + rowH;
        }, 0);

      const manualListH =
        result.automated_state.not_automated.length > 0
          ? 28 + result.automated_state.not_automated.length * 26
          : 0;
      const maxDiagramH = Math.max(
        185,
        getBottomLimit(doc) - doc.y - tableEstH - manualListH - 84
      );
      drawPdfFlowDiagram(doc, 'automated', result.automated_state.nodes, maxDiagramH);

      // Automation Table
      if (autoOps.length > 0) {
        ensureSpace(doc, 60);
        doc
          .font(FONT_BOLD)
          .fontSize(10.5)
          .fillColor(COLORS.textMain)
          .text('Automation Specifications', startX, doc.y, { width: pageW });
        doc.moveDown(0.3);

        const drawTableHeader = () => {
          const hy = doc.y;
          const headers = [
            'Automation',
            'Trigger',
            'Input, then action',
            'If it fails',
            'Human checkpoint',
          ];
          doc.rect(startX, hy, pageW, 24).fillAndStroke(COLORS.sageDark, COLORS.sageDark);
          let cx = startX;
          headers.forEach((h, i) => {
            doc
              .font(FONT_BOLD)
              .fontSize(8.5)
              .fillColor(COLORS.white)
              .text(h, cx + 5, hy + 7, { width: colWidths[i] - 10, lineBreak: false });
            cx += colWidths[i];
          });
          doc.y = hy + 24;
        };

        drawTableHeader();

        autoOps.forEach((node, rowIdx) => {
          const inputAction =
            [node.automation.input, node.automation.action].filter(Boolean).join(' → ') ||
            node.automation.description;
          const rowCells = [
            node.label,
            node.automation.trigger || node.automation.function || 'Rule-based trigger',
            inputAction,
            node.automation.exception_route || 'Alert process owner manually',
            node.automation.human_checkpoint,
          ];

          doc.font(FONT_REGULAR).fontSize(8.5);
          const rowH = Math.max(
            26,
            Math.max(
              ...rowCells.map((text, idx) =>
                doc.heightOfString(text, { width: colWidths[idx] - 10, lineGap: 1.5 })
              )
            ) + 12
          );

          if (doc.y + rowH > getBottomLimit(doc)) {
            doc.addPage();
            drawTableHeader();
          }

          const ry = doc.y;
          doc
            .rect(startX, ry, pageW, rowH)
            .fillAndStroke(rowIdx % 2 === 0 ? COLORS.white : COLORS.surface2, COLORS.border);

          let cx = startX;
          rowCells.forEach((text, idx) => {
            doc
              .font(idx === 0 ? FONT_BOLD : FONT_REGULAR)
              .fontSize(8.5)
              .fillColor(COLORS.textMain)
              .text(text, cx + 5, ry + 6, { width: colWidths[idx] - 10, lineGap: 1.5 });
            if (idx < rowCells.length - 1) {
              doc
                .strokeColor(COLORS.border)
                .lineWidth(0.5)
                .moveTo(cx + colWidths[idx], ry)
                .lineTo(cx + colWidths[idx], ry + rowH)
                .stroke();
            }
            cx += colWidths[idx];
          });

          doc.y = ry + rowH;
        });

        doc.moveDown(0.55);
      }
    }

    if (result.automated_state.not_automated.length > 0) {
      ensureSpace(doc, 48);
      doc
        .font(FONT_BOLD)
        .fontSize(10.5)
        .fillColor(COLORS.textMain)
        .text('Intentionally Left Manual', startX, doc.y, { width: pageW });
      doc.moveDown(0.22);

      result.automated_state.not_automated.forEach((item) => {
        const stepLabel = formatNotAutomatedStepTitle(
          item.step,
          redesignedSteps,
          result.redesigned_state.nodes
        );
        const textLine = `• ${stepLabel}: ${item.reason}`;
        doc.font(FONT_REGULAR).fontSize(10);
        const h = doc.heightOfString(textLine, { width: pageW - 10, lineGap: 1.5 });
        ensureSpace(doc, h + 4);
        doc
          .font(FONT_REGULAR)
          .fontSize(10)
          .fillColor(COLORS.textSec)
          .text(textLine, startX + 6, doc.y, { width: pageW - 10, lineGap: 1.5 });
        doc.moveDown(0.14);
      });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // PAGE 6: TIME, QUICK WINS, OPPORTUNITIES & 4-WEEK ROADMAP
    // If Page 5 had "not_yet" and used less than half the page, start Impact & Implementation below it
    // only if Page 5 is < 35% used (leaving room), otherwise start a dedicated Page 6 cleanly.
    // ───────────────────────────────────────────────────────────────────────────
    const page5FillRatio = (doc.y - 38) / (doc.page.height - 80);
    if (!(automationStatus === 'not_yet' && page5FillRatio < 0.34)) {
      doc.addPage();
    } else {
      doc.moveDown(0.75);
    }

    drawSectionHeading(
      doc,
      'Impact & Implementation',
      'Time Savings, Quick Wins & 4-Week Roadmap',
      undefined,
      true
    );

    if (!showTimeBlock) {
      const boxY = doc.y;
      const missingTimeMsg =
        'We need one number to estimate your time savings: how long this takes from start to finish. Add it in the audit.';
      doc.font(FONT_REGULAR).fontSize(10);
      const mh = doc.heightOfString(missingTimeMsg, { width: pageW - 28, lineGap: 2 });
      const bh = mh + 18;
      ensureSpace(doc, bh + 10);
      doc
        .roundedRect(startX, boxY, pageW, bh, 6)
        .fillAndStroke(COLORS.surface2, COLORS.border);
      doc
        .font(FONT_BOLD)
        .fontSize(10)
        .fillColor(COLORS.textMain)
        .text(missingTimeMsg, startX + 14, boxY + 9, { width: pageW - 28, lineGap: 2 });
      doc.y = boxY + bh + 10;
    } else {
      const rowsData: Array<[string, string]> = [];
      const runsStr = getOptionalHoursLabel(
        result.time_estimate.runs_per_week.min,
        result.time_estimate.runs_per_week.max,
        'runs/week'
      );
      if (runsStr) rowsData.push(['Estimated weekly volume', runsStr]);

      const curHrs = getOptionalHoursLabel(
        result.time_estimate.hours_per_week.current.min,
        result.time_estimate.hours_per_week.current.max,
        'hrs/week'
      );
      if (curHrs) rowsData.push(['Stage 1 — Process today', curHrs]);

      const redHrs = getOptionalHoursLabel(
        result.time_estimate.hours_per_week.redesigned.min,
        result.time_estimate.hours_per_week.redesigned.max,
        'hrs/week'
      );
      if (redHrs) rowsData.push(['Stage 2 — Improved without new software', redHrs]);

      const autoHrs = getOptionalHoursLabel(
        result.time_estimate.hours_per_week.automated.min,
        result.time_estimate.hours_per_week.automated.max,
        'hrs/week'
      );
      if (autoHrs) rowsData.push(['Stage 3 — With targeted automation', autoHrs]);

      const sharePct = getOptionalHoursLabel(
        result.time_estimate.redesign_share_percent.min,
        result.time_estimate.redesign_share_percent.max,
        '%'
      );
      if (sharePct) rowsData.push(['Share of savings from redesign alone', sharePct]);

      ensureSpace(doc, rowsData.length * 21 + 20);
      const tY = doc.y;
      rowsData.forEach(([label, val], idx) => {
        const ry = tY + idx * 20;
        doc
          .rect(startX, ry, pageW, 20)
          .fillAndStroke(idx % 2 === 0 ? COLORS.surface2 : COLORS.white, COLORS.border);
        doc
          .font(FONT_BOLD)
          .fontSize(9)
          .fillColor(COLORS.textMain)
          .text(label, startX + 10, ry + 5.5, { width: pageW * 0.64 });
        doc
          .font(FONT_BOLD)
          .fontSize(9)
          .fillColor(COLORS.sageDark)
          .text(val, startX + pageW * 0.64, ry + 5.5, { width: pageW * 0.34, align: 'right' });
      });

      doc.y = tY + rowsData.length * 20 + 5;
      doc
        .font(FONT_ITALIC)
        .fontSize(8.5)
        .fillColor(COLORS.textMuted)
        .text(result.time_estimate.caveat, startX, doc.y, { width: pageW, lineGap: 1.5 });
      doc.moveDown(0.45);
    }

    // Quick Wins
    if (result.quick_wins.length > 0) {
      ensureSpace(doc, 38);
      doc
        .font(FONT_BOLD)
        .fontSize(10.5)
        .fillColor(COLORS.textMain)
        .text('Quick Wins (This Week)', startX, doc.y, { width: pageW });
      doc.moveDown(0.18);

      result.quick_wins.forEach((qw, idx) => {
        const line = `${idx + 1}. ${qw.action} — ${qw.time_to_do}, ${
          qw.needs_new_software ? 'uses existing tool' : 'no new software'
        }`;
        doc.font(FONT_REGULAR).fontSize(10);
        const h = doc.heightOfString(line, { width: pageW - 8, lineGap: 1.5 });
        ensureSpace(doc, h + 3);
        doc
          .font(FONT_REGULAR)
          .fontSize(10)
          .fillColor(COLORS.textMain)
          .text(line, startX + 4, doc.y, { width: pageW - 8, lineGap: 1.5 });
        doc.moveDown(0.12);
      });
      doc.moveDown(0.38);
    }

    // Prioritised Automation Opportunities with Volume Verdicts
    if (result.automation_opportunities.length > 0) {
      ensureSpace(doc, 40);
      doc
        .font(FONT_BOLD)
        .fontSize(10.5)
        .fillColor(COLORS.textMain)
        .text('Prioritised Automation Opportunities', startX, doc.y, { width: pageW });
      doc.moveDown(0.18);

      result.automation_opportunities.forEach((opp) => {
        const verdictLabel =
          opp.verdict === 'worth_it_later' ? 'Worth it later' : 'Worth it now';
        const volumeNote = opp.why_this_volume ? ` ${opp.why_this_volume}` : '';
        const revisitNote =
          opp.verdict === 'worth_it_later' && opp.revisit_when
            ? ` Revisit: ${opp.revisit_when}`
            : '';
        const line = `• ${opp.name} [${verdictLabel} · Impact: ${opp.impact} · Effort: ${opp.effort}].${volumeNote}${revisitNote}`;

        doc.font(FONT_REGULAR).fontSize(10);
        const h = doc.heightOfString(line, { width: pageW - 8, lineGap: 1.5 });
        ensureSpace(doc, h + 3);
        doc
          .font(FONT_REGULAR)
          .fontSize(10)
          .fillColor(COLORS.textMain)
          .text(line, startX + 4, doc.y, { width: pageW - 8, lineGap: 1.5 });
        doc.moveDown(0.12);
      });
      doc.moveDown(0.38);
    }

    // 4-Week Implementation Sequence
    ensureSpace(doc, 54);
    doc
      .font(FONT_BOLD)
      .fontSize(10.5)
      .fillColor(COLORS.textMain)
      .text('4-Week Implementation Sequence', startX, doc.y, { width: pageW });
    doc.moveDown(0.2);

    result.implementation_order.forEach((wk) => {
      doc.font(FONT_BOLD).fontSize(10);
      const fh = doc.heightOfString(`Week ${wk.week}: ${wk.focus}`, { width: pageW });
      doc.font(FONT_REGULAR).fontSize(10);
      const ah = wk.actions.reduce(
        (acc, act) => acc + doc.heightOfString(`• ${act}`, { width: pageW - 14, lineGap: 1.3 }) + 2,
        0
      );
      ensureSpace(doc, fh + ah + 6);

      doc
        .font(FONT_BOLD)
        .fontSize(10)
        .fillColor(COLORS.sageDark)
        .text(`Week ${wk.week}: ${wk.focus}`, startX, doc.y, { width: pageW });
      wk.actions.forEach((act) => {
        doc
          .font(FONT_REGULAR)
          .fontSize(10)
          .fillColor(COLORS.textSec)
          .text(`• ${act}`, startX + 10, doc.y, { width: pageW - 14, lineGap: 1.3 });
      });
      doc.moveDown(0.2);
    });

    // Final Full Audit CTA Box (dynamic measured height prevents wrap overflow or trailing blank page)
    doc.font(FONT_BOLD).fontSize(10.5);
    const ctaTitleH = doc.heightOfString(result.cta, { width: pageW - 28, lineGap: 1.5 });
    const ctaBoxH = Math.max(56, ctaTitleH + 38);
    ensureSpace(doc, ctaBoxH + 8);
    doc.moveDown(0.25);
    const ctaY = doc.y;
    doc
      .roundedRect(startX, ctaY, pageW, ctaBoxH, 8)
      .fillAndStroke(COLORS.sageSoft, COLORS.sagePrimary);
    doc
      .font(FONT_BOLD)
      .fontSize(10.5)
      .fillColor(COLORS.textMain)
      .text(result.cta, startX + 14, ctaY + 10, { width: pageW - 28, lineGap: 1.5 });
    doc
      .font(FONT_BOLD)
      .fontSize(10)
      .fillColor(COLORS.sageDark)
      .text(`Book a 30-minute Systems Clarity Audit: ${AUDIT_URL_BASE}`, startX + 14, ctaY + 15 + ctaTitleH, {
        width: pageW - 28,
        link: AUDIT_URL_FOOTER_CTA,
        underline: true,
      });

    // Footer on every page (>= 8pt, clean process code, dynamic total count from bufferedPageRange)
    // Temporarily clear bottom margin on each buffered page so footer text never triggers PDFKit auto-pagination.
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const prevBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      const footerY = doc.page.height - 26;
      doc
        .font(FONT_REGULAR)
        .fontSize(8)
        .fillColor(COLORS.textMuted)
        .text(
          `Clarity Map Report · ${result.meta.process_name} · ${result.meta.process_code}`,
          startX,
          footerY,
          { width: pageW * 0.78, lineBreak: false, ellipsis: true }
        );
      doc
        .font(FONT_REGULAR)
        .fontSize(8)
        .fillColor(COLORS.textMuted)
        .text(`Page ${i + 1} of ${range.count}`, startX, footerY, {
          width: pageW,
          align: 'right',
          lineBreak: false,
        });
      doc.page.margins.bottom = prevBottom;
    }

    doc.end();
  });
}
