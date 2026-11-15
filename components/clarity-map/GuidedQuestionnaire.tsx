import React, { useEffect, useState } from 'react';
import { Check, Info, ShieldAlert } from 'lucide-react';
import {
  getQuestionDisplayText,
  getVisibleQuestions,
} from '../../features/clarity-map/services/processLibrary';
import type {
  IndustryDefinition,
  ProcessDefinition,
  QuestionAnswerValue,
  QuestionDefinition,
} from '../../features/clarity-map/types/clarityMap';

interface GuidedQuestionnaireProps {
  industry: IndustryDefinition;
  process: ProcessDefinition;
  answers: Record<string, QuestionAnswerValue>;
  currentIndex: number;
  onChangeIndex: (idx: number) => void;
  onUpdateAnswer: (qid: string, value: QuestionAnswerValue) => void;
  onComplete: () => void;
  onBackToLanding: () => void;
}

const STEP_TIME_OPTIONS = [
  'Under 15 min',
  '15–60 min',
  '1–3 hrs',
  'Half a day+',
  'Not sure',
];

function isQuestionAnswered(
  q: QuestionDefinition,
  val: QuestionAnswerValue | undefined
): boolean {
  if (!val) return false;
  if (val.isNotSure) return true;
  if (val.answer === null || val.answer === undefined) return false;

  if (Array.isArray(val.answer)) {
    if (val.answer.length === 0) return false;
    if (val.answer.includes('Other') && (!val.otherText || val.otherText.trim() === '')) {
      return false;
    }
    return true;
  }

  if (typeof val.answer === 'string') {
    if (val.answer.trim() === '') return false;
    if (val.answer === 'Other' && (!val.otherText || val.otherText.trim() === '')) {
      return false;
    }
    return true;
  }

  return true;
}

const GuidedQuestionnaire: React.FC<GuidedQuestionnaireProps> = ({
  industry,
  process,
  answers,
  currentIndex,
  onChangeIndex,
  onUpdateAnswer,
  onComplete,
  onBackToLanding,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  const visibleQuestions = getVisibleQuestions(process, answers);
  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, visibleQuestions.length - 1));
  const question = visibleQuestions[safeIndex];

  useEffect(() => {
    if (safeIndex !== currentIndex) {
      onChangeIndex(safeIndex);
    }
  }, [safeIndex, currentIndex, onChangeIndex]);

  useEffect(() => {
    setValidationError(null);
  }, [question?.qid]);

  if (!question) {
    return null;
  }

  const currentVal = answers[question.qid];
  const displayQuestionText = getQuestionDisplayText(question, answers);
  const isLast = safeIndex === visibleQuestions.length - 1;
  const isProcessSpecificStep =
    !question.qid.startsWith('C') && question.type !== 'time_range' && !question.isTimeQuestion;
  const progressPercent = Math.round(((safeIndex + 1) / Math.max(1, visibleQuestions.length)) * 100);

  const setValue = (patch: Partial<QuestionAnswerValue>) => {
    setValidationError(null);
    const base: QuestionAnswerValue = currentVal ?? {
      qid: question.qid,
      question: displayQuestionText,
      stage: question.stage,
      answer: question.type === 'multi_select' ? [] : '',
      time_range: null,
      isNotSure: false,
    };
    onUpdateAnswer(question.qid, {
      ...base,
      question: displayQuestionText,
      stage: question.stage,
      ...patch,
    });
  };

  const handleSingleSelect = (option: string) => {
    const isNotSure = option === 'Not sure';
    setValue({
      answer: option,
      isNotSure,
      otherText: option === 'Other' ? currentVal?.otherText || '' : undefined,
      time_range:
        question.type === 'time_range' ? (isNotSure ? null : option) : currentVal?.time_range ?? null,
    });
  };

  const handleMultiToggle = (option: string) => {
    const existing = Array.isArray(currentVal?.answer) ? currentVal.answer : [];
    if (option === 'Not sure') {
      const currentlySelected = existing.includes('Not sure');
      setValue({
        answer: currentlySelected ? [] : ['Not sure'],
        isNotSure: !currentlySelected,
        otherText: undefined,
      });
      return;
    }

    const filtered = existing.filter((x) => x !== 'Not sure');
    const nextArr = filtered.includes(option)
      ? filtered.filter((x) => x !== option)
      : [...filtered, option];

    setValue({
      answer: nextArr,
      isNotSure: false,
      otherText: nextArr.includes('Other') ? currentVal?.otherText || '' : undefined,
    });
  };

  const handleStepTimeSelect = (timeLabel: string) => {
    setValue({
      time_range: currentVal?.time_range === timeLabel ? null : timeLabel,
    });
  };

  const handleNext = () => {
    if (question.required !== false && !isQuestionAnswered(question, currentVal)) {
      if (
        (currentVal?.answer === 'Other' ||
          (Array.isArray(currentVal?.answer) && currentVal.answer.includes('Other'))) &&
        (!currentVal?.otherText || currentVal.otherText.trim() === '')
      ) {
        setValidationError('Please describe what you chose under "Other" to continue.');
      } else {
        setValidationError('Please select or enter an answer, or choose "Not sure" if unknown.');
      }
      return;
    }

    if (isLast) {
      onComplete();
    } else {
      onChangeIndex(safeIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setValidationError(null);
    if (safeIndex === 0) {
      onBackToLanding();
    } else {
      onChangeIndex(safeIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const singleOptions = [...(question.options || [])];
  if (question.allowOther && !singleOptions.includes('Other')) singleOptions.push('Other');
  if (question.allowNotSure && !singleOptions.includes('Not sure')) singleOptions.push('Not sure');

  const multiSelected = Array.isArray(currentVal?.answer) ? currentVal.answer : [];
  const selectedSingle = typeof currentVal?.answer === 'string' ? currentVal.answer : '';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-sage-border/70">
        <button
          type="button"
          onClick={onBackToLanding}
          className="font-serif font-bold text-base sm:text-lg text-[#405A46] hover:opacity-80 transition-opacity"
        >
          The Clarity Map
        </button>
        <div className="text-xs sm:text-sm text-sage-sec">
          <button
            type="button"
            onClick={onBackToLanding}
            className="hover:text-sage-text transition-colors"
          >
            {industry.name}
          </button>
          <span className="mx-1.5 text-sage-muted">&rsaquo;</span>
          <span className="text-sage-text font-medium">{process.process_name}</span>
        </div>
      </div>

      {/* Slim Horizontal Progress Bar */}
      <div className="max-w-3xl mx-auto space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-sage-sec tabular-nums">
          <span>
            Question {safeIndex + 1} of {visibleQuestions.length}
          </span>
          <span className="text-sage-muted">{question.stage}</span>
        </div>
        <div className="w-full h-1.5 bg-sage-border rounded-full overflow-hidden">
          <div
            className="h-full bg-[#405A46] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {process.regulated && process.regulated_notice && safeIndex === 0 && (
        <div className="max-w-3xl mx-auto bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-950 leading-relaxed">{process.regulated_notice}</p>
        </div>
      )}

      {/* Centered Question Card */}
      <div className="max-w-3xl mx-auto bg-white border border-sage-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-soft">
        <div className="space-y-2">
          <h2 className="font-serif text-2xl sm:text-[26px] font-bold text-sage-text leading-snug">
            {displayQuestionText}
          </h2>
          {question.helpText && (
            <p className="text-sm text-sage-sec leading-relaxed">{question.helpText}</p>
          )}
        </div>

        {/* Option Rows */}
        {(question.type === 'single_select' || question.type === 'time_range') && (
          <div className="space-y-2.5">
            {singleOptions.map((option) => {
              const isActive = selectedSingle === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSingleSelect(option)}
                  className={`w-full text-left px-5 py-3.5 rounded-xl border text-sm sm:text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#405A46] ${
                    isActive
                      ? 'bg-[#405A46] border-[#405A46] text-white'
                      : 'bg-white border-sage-border text-sage-text hover:border-[#405A46]/60'
                  }`}
                >
                  {option}
                </button>
              );
            })}

            {selectedSingle === 'Other' && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-sage-sec mb-1.5">
                  Please specify briefly
                </label>
                <input
                  type="text"
                  value={currentVal?.otherText || ''}
                  onChange={(e) => setValue({ otherText: e.target.value })}
                  placeholder="Describe briefly..."
                  className="w-full px-4 py-3 rounded-xl border border-sage-border bg-white text-sage-text text-sm input-interaction"
                  autoFocus
                />
              </div>
            )}
          </div>
        )}

        {question.type === 'multi_select' && (
          <div className="space-y-2.5">
            <p className="text-xs text-sage-muted">Select all that apply</p>
            <div className="space-y-2">
              {singleOptions.map((option) => {
                const isChecked = multiSelected.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleMultiToggle(option)}
                    className={`w-full text-left px-5 py-3.5 rounded-xl border text-sm sm:text-base font-medium transition-colors flex items-center justify-between gap-3 ${
                      isChecked
                        ? 'bg-[#405A46] border-[#405A46] text-white'
                        : 'bg-white border-sage-border text-sage-text hover:border-[#405A46]/60'
                    }`}
                  >
                    <span>{option}</span>
                    {isChecked && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {multiSelected.includes('Other') && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-sage-sec mb-1.5">
                  What else is used?
                </label>
                <input
                  type="text"
                  value={currentVal?.otherText || ''}
                  onChange={(e) => setValue({ otherText: e.target.value })}
                  placeholder="Describe briefly..."
                  className="w-full px-4 py-3 rounded-xl border border-sage-border bg-white text-sage-text text-sm input-interaction"
                />
              </div>
            )}
          </div>
        )}

        {(question.type === 'short_text' || question.type === 'numeric_range') && (
          <div className="space-y-3">
            {question.options && question.options.length > 0 ? (
              <div className="space-y-2">
                {question.options.map((option) => {
                  const isActive = selectedSingle === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSingleSelect(option)}
                      className={`w-full text-left px-5 py-3.5 rounded-xl border text-sm sm:text-base font-medium transition-colors ${
                        isActive
                          ? 'bg-[#405A46] border-[#405A46] text-white'
                          : 'bg-white border-sage-border text-sage-text hover:border-[#405A46]/60'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                type="text"
                value={typeof currentVal?.answer === 'string' && !currentVal?.isNotSure ? currentVal.answer : ''}
                onChange={(e) => setValue({ answer: e.target.value, isNotSure: false })}
                placeholder={question.placeholder || 'Type your answer...'}
                className="w-full px-4 py-3.5 rounded-xl border border-sage-border bg-white text-sage-text text-base input-interaction"
              />
            )}
            {question.allowNotSure && !(question.options || []).includes('Not sure') && (
              <button
                type="button"
                onClick={() => setValue({ answer: 'Not sure', isNotSure: true })}
                className={`text-xs font-medium px-3.5 py-2 rounded-lg border transition-colors ${
                  currentVal?.isNotSure
                    ? 'bg-[#405A46] border-[#405A46] text-white'
                    : 'bg-white border-sage-border text-sage-sec hover:text-sage-text'
                }`}
              >
                Not sure
              </button>
            )}
          </div>
        )}

        {question.type === 'long_text' && (
          <div className="space-y-3">
            <textarea
              rows={4}
              value={typeof currentVal?.answer === 'string' && !currentVal?.isNotSure ? currentVal.answer : ''}
              onChange={(e) => setValue({ answer: e.target.value, isNotSure: false })}
              placeholder={question.placeholder || 'Describe how this usually works...'}
              className="w-full px-4 py-3.5 rounded-xl border border-sage-border bg-white text-sage-text text-base input-interaction resize-y"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-sage-muted">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {question.privacyNote ||
                    'Please do not include real customer names, phone numbers, or account numbers.'}
                </span>
              </div>
              {question.allowNotSure && (
                <button
                  type="button"
                  onClick={() => setValue({ answer: 'Not sure', isNotSure: true })}
                  className={`text-xs font-medium px-3.5 py-2 rounded-lg border transition-colors ${
                    currentVal?.isNotSure
                      ? 'bg-[#405A46] border-[#405A46] text-white'
                      : 'bg-white border-sage-border text-sage-sec hover:text-sage-text'
                  }`}
                >
                  Not sure / varies every time
                </button>
              )}
            </div>
          </div>
        )}

        {/* Inline Step Time Pill Row so step durations feed directly into Gemini timing analysis */}
        {isProcessSpecificStep && (
          <div className="pt-2 space-y-2.5">
            <div className="text-sm font-medium text-sage-text">
              How long does this step usually take?
            </div>
            <div className="flex flex-wrap gap-2">
              {STEP_TIME_OPTIONS.map((tOpt) => {
                const isTimeActive = currentVal?.time_range === tOpt;
                return (
                  <button
                    key={tOpt}
                    type="button"
                    onClick={() => handleStepTimeSelect(tOpt)}
                    className={`px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-colors ${
                      isTimeActive
                        ? 'bg-[#405A46] border-[#405A46] text-white'
                        : 'bg-white border-sage-border text-sage-text hover:border-[#405A46]/60'
                    }`}
                  >
                    {tOpt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {validationError && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-xl">
            {validationError}
          </div>
        )}

        {/* Bottom Back / Next Row */}
        <div className="pt-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrevious}
            className="px-6 py-3 rounded-xl border border-sage-border bg-white hover:bg-sage-surface-2 text-sage-text text-sm font-medium transition-colors"
          >
            Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-7 py-3 rounded-xl bg-[#405A46] hover:bg-[#334838] text-white text-sm font-semibold transition-colors"
          >
            {isLast ? 'Review answers' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuidedQuestionnaire;
