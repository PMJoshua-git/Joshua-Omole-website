import React, { useEffect, useRef } from 'react';
import {
  Activity,
  ArrowRight,
  Briefcase,
  Building2,
  Cpu,
  Landmark,
  Layers,
  Megaphone,
  RotateCcw,
  ShieldAlert,
  ShoppingBag,
  Store,
  Truck,
  UserCheck,
  Users,
} from 'lucide-react';
import type {
  IndustryDefinition,
  ProcessDefinition,
} from '../../features/clarity-map/types/clarityMap';

interface IntroductionProps {
  industries: IndustryDefinition[];
  selectedIndustryId: string | null;
  processes: ProcessDefinition[];
  selectedProcessCode: string | null;
  onSelectIndustry: (industryId: string) => void;
  onSelectProcess: (processCode: string) => void;
  onStartQuestionnaire: () => void;
  canResumeInProgress: boolean;
  onResumeInProgress?: () => void;
}

/** Exact Lucide icons matching Home.tsx Industries Served section */
const INDUSTRY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  'real-estate': Building2,
  'ecommerce': ShoppingBag,
  'retail': Store,
  'professional-coaching': UserCheck,
  'saas-tech': Cpu,
  'professional-services': Briefcase,
  'healthcare-clinics': Activity,
  'logistics-supply-chain': Truck,
  'financial-services': Landmark,
  'digital-agencies': Layers,
  'b2b-agencies': Users,
  'b2c-agencies': Megaphone,
};

const Introduction: React.FC<IntroductionProps> = ({
  industries,
  selectedIndustryId,
  processes,
  selectedProcessCode,
  onSelectIndustry,
  onSelectProcess,
  onStartQuestionnaire,
  canResumeInProgress,
  onResumeInProgress,
}) => {
  const processSectionRef = useRef<HTMLElement | null>(null);
  const justPickedIndustryRef = useRef(false);

  const selectedIndustry = industries.find((i) => i.id === selectedIndustryId) || null;
  const selectedProcess = processes.find((p) => p.process_code === selectedProcessCode) || null;

  useEffect(() => {
    if (justPickedIndustryRef.current && selectedIndustry && processSectionRef.current) {
      justPickedIndustryRef.current = false;
      processSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedIndustry]);

  const handleIndustryClick = (id: string) => {
    justPickedIndustryRef.current = true;
    onSelectIndustry(id);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-9">
      {/* Subtle Clarity Map Top Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-sage-border/70">
        <span className="font-serif font-bold text-base sm:text-lg text-[#405A46]">
          The Clarity Map
        </span>
        <span className="text-xs sm:text-sm text-sage-sec">
          Free process mapper by Joshua Omole
        </span>
      </div>

      {/* Hero Copy */}
      <section className="space-y-4 max-w-2xl">
        <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-sage-sec">
          STEP 1 OF 3 · CHOOSE YOUR BUSINESS
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-sage-text tracking-tight leading-[1.12]">
          See how your process runs today, and how it should run.
        </h1>
        <p className="text-base sm:text-lg text-sage-sec leading-relaxed">
          Pick your industry, answer quick guided questions, and get a map of your current process next to a redesigned version.
        </p>
      </section>

      {/* Instant 12-Industry Grid with Home.tsx Industries Served Icons */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-sage-text">
            Industry
          </h2>
          {canResumeInProgress && onResumeInProgress && (
            <button
              type="button"
              onClick={onResumeInProgress}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#405A46] hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resume in-progress questions</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {industries.map((industry) => {
            const isSelected = selectedIndustryId === industry.id;
            const IconComp = INDUSTRY_ICONS[industry.id] || Briefcase;
            return (
              <button
                key={industry.id}
                type="button"
                onClick={() => handleIndustryClick(industry.id)}
                className={`group text-left rounded-xl px-4 py-3.5 border text-sm font-medium transition-all flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#405A46] ${
                  isSelected
                    ? 'bg-[#405A46] border-[#405A46] text-white shadow-soft'
                    : 'bg-white border-sage-border text-sage-text hover:border-[#405A46]/60'
                }`}
              >
                <IconComp
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isSelected ? 'text-white' : 'text-sage-primary'
                  }`}
                />
                <span className="leading-snug">{industry.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Inline Process Selector (auto-scrolled into view when an industry is chosen) */}
      {selectedIndustry && (
        <section
          ref={processSectionRef}
          className="space-y-4 pt-2 scroll-mt-24 animate-fade-in"
        >
          <h2 className="font-serif text-lg sm:text-xl font-bold text-sage-text">
            Process
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {processes.map((proc) => {
              const isSelected = selectedProcessCode === proc.process_code;
              return (
                <button
                  key={proc.process_code}
                  type="button"
                  onClick={() => onSelectProcess(proc.process_code)}
                  className={`text-left rounded-xl px-4 py-3.5 border text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#405A46] ${
                    isSelected
                      ? 'bg-[#405A46] border-[#405A46] text-white shadow-soft'
                      : 'bg-white border-sage-border text-sage-text hover:border-[#405A46]/60'
                  }`}
                >
                  {proc.process_name}
                </button>
              );
            })}
          </div>

          {selectedIndustry.regulated && selectedIndustry.regulatedNotice && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
              <span>{selectedIndustry.regulatedNotice}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-sage-sec">
              About 4 minutes. You can see your map without leaving an email.
            </p>

            {selectedProcess && (
              <button
                type="button"
                onClick={onStartQuestionnaire}
                className="group inline-flex items-center justify-center gap-2 bg-[#405A46] hover:bg-[#334838] text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-soft transition-colors shrink-0"
              >
                <span>Continue with {selectedProcess.process_name}</span>
                <ArrowRight className="w-4 h-4 icon-shifter" />
              </button>
            )}
          </div>
        </section>
      )}

      {!selectedIndustry && (
        <p className="text-xs sm:text-sm text-sage-sec">
          About 4 minutes. You can see your map without leaving an email.
        </p>
      )}
    </div>
  );
};

export default Introduction;
