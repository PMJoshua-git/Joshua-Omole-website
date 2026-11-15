import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '../components/Layout';
import Introduction from '../components/clarity-map/Introduction';
import GuidedQuestionnaire from '../components/clarity-map/GuidedQuestionnaire';
import AnswerReview from '../components/clarity-map/AnswerReview';
import AnalysisLoading from '../components/clarity-map/AnalysisLoading';
import EmailCaptureModal from '../components/clarity-map/EmailCaptureModal';
import WorkflowResultsView from '../components/clarity-map/WorkflowResultsView';
import RateLimitCard from '../components/clarity-map/RateLimitCard';
import {
  getIndustries,
  getIndustryById,
  getProcessByCode,
  getProcessesByIndustry,
  getQuestionDisplayText,
  getVisibleQuestions,
} from '../features/clarity-map/services/processLibrary';
import {
  analyzeWorkflow,
  clearClarityMapSession,
  fetchLimitStatus,
  HighDemandError,
  RateLimitError,
  saveClarityMapSession,
  trackClarityMapEvent,
  type ClarityMapScreen,
  type RateLimitInfo,
} from '../features/clarity-map/services/clarityMapApi';
import type {
  ClarityMapResult,
  ClarityMapStage,
  QuestionAnswerValue,
  QuestionnaireSubmission,
} from '../features/clarity-map/types/clarityMap';

const ClarityMap: React.FC = () => {
  const industries = useMemo(() => getIndustries(), []);

  const [screen, setScreen] = useState<ClarityMapScreen>('intro');
  const [industryId, setIndustryId] = useState<string | null>(null);
  const [processCode, setProcessCode] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswerValue>>({});
  const [analysis, setAnalysis] = useState<ClarityMapResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<ClarityMapStage>('current');

  // Optional pre-visual email capture modal & report status
  const [emailPromptHandled, setEmailPromptHandled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'gate' | 'later'>('gate');
  const [reportSentToEmail, setReportSentToEmail] = useState<string | null>(null);
  const [reportFirstName, setReportFirstName] = useState<string | null>(null);

  const [canResumeInProgress, setCanResumeInProgress] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [limitGateState, setLimitGateState] = useState<{
    variant: 'rate_limited' | 'high_demand';
    resetAt: string | null;
  } | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    trackClarityMapEvent('studio_viewed');
    hydratedRef.current = true;

    let cancelled = false;
    fetchLimitStatus().then((status) => {
      if (cancelled || !status) return;
      setRateLimitInfo({
        limit: status.limit,
        remaining: status.remaining,
        reset_at: status.reset_at,
      });
      if (status.limited) {
        setLimitGateState({
          variant: 'rate_limited',
          resetAt: status.reset_at,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (screen === 'intro' && !industryId && !analysis) return;

    saveClarityMapSession({
      screen: screen === 'analyzing' ? 'review' : screen,
      industryId,
      processCode,
      currentQuestionIndex,
      answers,
      analysis,
      activeStage,
      emailPromptHandled,
      reportSentToEmail,
      reportFirstName,
    });
  }, [
    screen,
    industryId,
    processCode,
    currentQuestionIndex,
    answers,
    analysis,
    activeStage,
    emailPromptHandled,
    reportSentToEmail,
    reportFirstName,
  ]);

  const selectedIndustry = useMemo(
    () => (industryId ? getIndustryById(industryId) : undefined),
    [industryId]
  );

  const industryProcesses = useMemo(
    () => (industryId ? getProcessesByIndustry(industryId) : []),
    [industryId]
  );

  const selectedProcess = useMemo(
    () => (processCode ? getProcessByCode(processCode) : undefined),
    [processCode]
  );

  const handleResumeInProgress = () => {
    if (!canResumeInProgress) return;
    setScreen('questionnaire');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartFresh = () => {
    clearClarityMapSession();
    setCanResumeInProgress(false);
    setIndustryId(null);
    setProcessCode(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setAnalysis(null);
    setAnalysisError(null);
    setActiveStage('current');
    setEmailPromptHandled(false);
    setIsModalOpen(false);
    setReportSentToEmail(null);
    setReportFirstName(null);
    setScreen('intro');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchLimitStatus().then((status) => {
      if (!status) return;
      setRateLimitInfo({
        limit: status.limit,
        remaining: status.remaining,
        reset_at: status.reset_at,
      });
      if (status.limited) {
        setLimitGateState({
          variant: 'rate_limited',
          resetAt: status.reset_at,
        });
      } else {
        setLimitGateState(null);
      }
    });
  };

  const handleSelectIndustry = (nextIndustryId: string) => {
    if (nextIndustryId !== industryId) {
      setIndustryId(nextIndustryId);
      setProcessCode(null);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setAnalysis(null);
      setEmailPromptHandled(false);
    }
    trackClarityMapEvent('industry_selected', { industry_id: nextIndustryId });
  };

  const handleSelectProcess = (nextProcessCode: string) => {
    if (nextProcessCode !== processCode) {
      setProcessCode(nextProcessCode);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setAnalysis(null);
      setEmailPromptHandled(false);
    }
    trackClarityMapEvent('process_selected', { process_code: nextProcessCode });
  };

  const handleStartQuestionnaire = () => {
    if (!selectedProcess) return;
    trackClarityMapEvent('questionnaire_started', { process_code: selectedProcess.process_code });
    setCanResumeInProgress(true);
    setScreen('questionnaire');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateAnswer = (qid: string, val: QuestionAnswerValue) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: val,
    }));
  };

  const handleCompleteQuestionnaire = () => {
    if (selectedProcess) {
      trackClarityMapEvent('questionnaire_completed', {
        process_code: selectedProcess.process_code,
      });
    }
    setScreen('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildSubmissionPayload = (): QuestionnaireSubmission | null => {
    if (!selectedIndustry || !selectedProcess) return null;
    const visible = getVisibleQuestions(selectedProcess, answers);

    const formattedAnswers = visible.map((q) => {
      const val = answers[q.qid];
      const questionText = getQuestionDisplayText(q, answers);
      let finalAnswer: string | number | boolean | string[] = 'Not sure';
      let timeRange: string | null = val?.time_range ?? null;

      if (val && !val.isNotSure) {
        if (Array.isArray(val.answer)) {
          finalAnswer = val.answer.map((entry) =>
            entry === 'Other' && val.otherText ? `Other: ${val.otherText}` : entry
          );
        } else if (val.answer === 'Other' && val.otherText) {
          finalAnswer = `Other: ${val.otherText}`;
        } else if (val.answer !== null && val.answer !== undefined && val.answer !== '') {
          finalAnswer = val.answer;
        }
        if (q.isTimeQuestion || q.type === 'time_range') {
          timeRange = typeof finalAnswer === 'string' ? finalAnswer : val.time_range ?? null;
        }
      }

      return {
        qid: q.qid,
        question: questionText,
        answer: finalAnswer,
        time_range: timeRange,
      };
    });

    return {
      industry: selectedIndustry.name,
      industry_id: selectedIndustry.id,
      process_code: selectedProcess.process_code,
      process_name: selectedProcess.process_name,
      questionnaire_version: selectedProcess.questionnaire_version,
      answers: formattedAnswers,
    };
  };

  const runAnalysis = async () => {
    const payload = buildSubmissionPayload();
    if (!payload) return;

    setScreen('analyzing');
    setAnalysisError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const response = await analyzeWorkflow(payload);
      setAnalysis(response.analysis);
      if (response.rate_limit) {
        setRateLimitInfo(response.rate_limit);
      }
      setLimitGateState(null);
      setActiveStage('current');
      trackClarityMapEvent('analysis_succeeded', {
        process_code: payload.process_code,
        readiness_score: response.analysis.readiness.score_percent,
      });

      setModalMode('gate');
      setEmailPromptHandled(false);
      setIsModalOpen(true);
      setScreen('results');
    } catch (err: any) {
      if (err instanceof RateLimitError) {
        // Keep all answers intact in state; show calm limit card instead of generic error
        setRateLimitInfo({
          limit: err.limit,
          remaining: 0,
          reset_at: err.reset_at,
        });
        setLimitGateState({
          variant: 'rate_limited',
          resetAt: err.reset_at,
        });
        setScreen('review');
        return;
      }

      if (err instanceof HighDemandError) {
        setLimitGateState({
          variant: 'high_demand',
          resetAt: null,
        });
        setScreen('review');
        return;
      }

      const message =
        err?.message || 'Unable to complete the workflow analysis right now. Please try again.';
      trackClarityMapEvent('analysis_failed', { process_code: payload.process_code });
      setAnalysisError(message);
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Clarity Map | Interactive Business Workflow Diagnostic | Joshua Omole</title>
        <meta
          name="description"
          content="See how your business workflows currently run, how to fix them without new software using BRIDGE, and where automation truly belongs."
        />
        <meta property="og:title" content="Clarity Map | Interactive Business Workflow Diagnostic | Joshua Omole" />
        <meta
          property="og:description"
          content="See how your business workflows currently run, how to fix them without new software using BRIDGE, and where automation truly belongs."
        />
        <meta property="og:url" content="https://joshuaomole.com/clarity-map" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="Clarity Map | Interactive Business Workflow Diagnostic | Joshua Omole" />
        <meta
          name="twitter:description"
          content="See how your business workflows currently run, how to fix them without new software using BRIDGE, and where automation truly belongs."
        />
        <link rel="canonical" href="https://joshuaomole.com/clarity-map" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16 min-h-[75vh]">
        {limitGateState && screen !== 'results' ? (
          <RateLimitCard
            variant={limitGateState.variant}
            resetAt={limitGateState.resetAt}
          />
        ) : (
          <>
            {screen === 'intro' && (
              <Introduction
                industries={industries}
                selectedIndustryId={industryId}
                processes={industryProcesses}
                selectedProcessCode={processCode}
                onSelectIndustry={handleSelectIndustry}
                onSelectProcess={(code) => {
                  handleSelectProcess(code);
                }}
                onStartQuestionnaire={handleStartQuestionnaire}
                canResumeInProgress={canResumeInProgress && Object.keys(answers).length > 0}
                onResumeInProgress={handleResumeInProgress}
              />
            )}

            {screen === 'questionnaire' && selectedIndustry && selectedProcess && (
              <GuidedQuestionnaire
                industry={selectedIndustry}
                process={selectedProcess}
                answers={answers}
                currentIndex={currentQuestionIndex}
                onChangeIndex={setCurrentQuestionIndex}
                onUpdateAnswer={handleUpdateAnswer}
                onComplete={handleCompleteQuestionnaire}
                onBackToLanding={() => {
                  setScreen('intro');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {screen === 'review' && selectedIndustry && selectedProcess && (
              <AnswerReview
                industry={selectedIndustry}
                process={selectedProcess}
                answers={answers}
                onEditQuestion={(idx) => {
                  setCurrentQuestionIndex(idx);
                  setScreen('questionnaire');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSubmitAnalysis={runAnalysis}
                onBack={() => {
                  setScreen('questionnaire');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {screen === 'analyzing' && selectedIndustry && selectedProcess && (
              <AnalysisLoading
                processName={selectedProcess.process_name}
                industryName={selectedIndustry.name}
                error={analysisError}
                onRetry={runAnalysis}
                onBackToReview={() => {
                  setAnalysisError(null);
                  setScreen('review');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </>
        )}

        {screen === 'results' && analysis && (
          <>
            <div
              className={
                isModalOpen && !emailPromptHandled
                  ? 'blur-[2px] pointer-events-none select-none opacity-60 transition-all'
                  : ''
              }
            >
              <WorkflowResultsView
                analysis={analysis}
                industry={selectedIndustry}
                activeStage={activeStage}
                onChangeStage={setActiveStage}
                onOpenReportModal={() => {
                  setModalMode('later');
                  setIsModalOpen(true);
                }}
                onStartOver={handleStartFresh}
                reportSentToEmail={reportSentToEmail}
                rateLimit={rateLimitInfo}
              />
            </div>

            <EmailCaptureModal
              isOpen={isModalOpen}
              mode={modalMode}
              analysis={analysis}
              initialFirstName={reportFirstName}
              initialEmail={reportSentToEmail}
              onContinueToVisual={() => {
                setEmailPromptHandled(true);
                setIsModalOpen(false);
              }}
              onCloseLater={() => {
                setIsModalOpen(false);
              }}
              onReportSentSuccess={({ firstName, email }) => {
                setEmailPromptHandled(true);
                setReportFirstName(firstName);
                setReportSentToEmail(email);
              }}
            />
          </>
        )}
      </div>
    </Layout>
  );
};

export default ClarityMap;
