import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight, Pencil, ShieldCheck } from 'lucide-react';
import {
  getQuestionDisplayText,
  getVisibleQuestions,
} from '../../features/clarity-map/services/processLibrary';
import type {
  IndustryDefinition,
  ProcessDefinition,
  QuestionAnswerValue,
} from '../../features/clarity-map/types/clarityMap';

interface AnswerReviewProps {
  industry: IndustryDefinition;
  process: ProcessDefinition;
  answers: Record<string, QuestionAnswerValue>;
  onEditQuestion: (visibleIndex: number) => void;
  onSubmitAnalysis: () => void;
  onBack: () => void;
}

function formatDisplayAnswer(val: QuestionAnswerValue | undefined): string {
  if (!val) return 'Not answered';
  if (val.isNotSure) return 'Not sure';
  if (Array.isArray(val.answer)) {
    const mapped = val.answer.map((item) =>
      item === 'Other' && val.otherText ? `Other: ${val.otherText}` : item
    );
    return mapped.length > 0 ? mapped.join(', ') : 'Not answered';
  }
  if (val.answer === 'Other' && val.otherText) {
    return `Other: ${val.otherText}`;
  }
  if (val.answer === null || val.answer === undefined || val.answer === '') {
    return 'Not answered';
  }
  return String(val.answer);
}

const AnswerReview: React.FC<AnswerReviewProps> = ({
  industry,
  process,
  answers,
  onEditQuestion,
  onSubmitAnalysis,
  onBack,
}) => {
  const visibleQuestions = getVisibleQuestions(process, answers);

  const groupedByStage = useMemo(() => {
    const groups: Array<{
      stage: string;
      items: Array<{ qid: string; questionText: string; answerText: string; index: number }>;
    }> = [];

    visibleQuestions.forEach((q, idx) => {
      let group = groups.find((g) => g.stage === q.stage);
      if (!group) {
        group = { stage: q.stage, items: [] };
        groups.push(group);
      }
      group.items.push({
        qid: q.qid,
        questionText: getQuestionDisplayText(q, answers),
        answerText: formatDisplayAnswer(answers[q.qid]),
        index: idx,
      });
    });

    return groups;
  }, [visibleQuestions, answers]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-sage-border pb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-sec hover:text-sage-text mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to last question</span>
        </button>
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-sage-primary mb-1">
          Step 3 of 3 · Confirm Your Workflow Answers
        </div>
        <h1 className="font-serif text-3xl font-bold text-sage-text">
          Review before generating your Clarity Map
        </h1>
        <p className="text-sm text-sage-sec mt-2">
          {industry.name} · <span className="font-medium text-sage-text">{process.process_name}</span> ({process.process_code})
        </p>
      </div>

      <div className="space-y-6">
        {groupedByStage.map((group) => (
          <div
            key={group.stage}
            className="bg-sage-surface border border-sage-border rounded-2xl overflow-hidden"
          >
            <div className="bg-sage-surface-2 px-6 py-3 border-b border-sage-border flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-sage-primary">
                {group.stage}
              </h2>
              <span className="text-xs text-sage-muted tabular-nums">
                {group.items.length} item{group.items.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="divide-y divide-sage-border/70">
              {group.items.map((item) => (
                <div
                  key={item.qid}
                  className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-sage-bg/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-sage-sec">{item.questionText}</div>
                    <div className="text-base font-semibold text-sage-text">{item.answerText}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEditQuestion(item.index)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-sage-primary hover:text-sage-primary-hover px-2.5 py-1.5 rounded-lg hover:bg-sage-soft transition-colors shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-sage-surface border border-sage-border rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5 text-xs text-sage-sec max-w-md">
          <ShieldCheck className="w-4 h-4 text-sage-primary shrink-0 mt-0.5" />
          <span>
            Any accidental email addresses or phone numbers in text answers are automatically stripped before analysis.
          </span>
        </div>

        <button
          type="button"
          onClick={onSubmitAnalysis}
          className="group inline-flex items-center justify-center gap-2.5 bg-sage-primary hover:bg-sage-primary-hover text-white font-semibold px-7 py-3.5 rounded-xl shadow-soft transition-colors shrink-0"
        >
          <span>Generate my Clarity Map</span>
          <ArrowRight className="w-4 h-4 icon-shifter" />
        </button>
      </div>
    </div>
  );
};

export default AnswerReview;
