import React from 'react';
import FadeIn from './FadeIn';

interface ProcessStepProps {
  number: string;
  title: string;
  description: string;
  isLast?: boolean;
  delay?: number;
}

const ProcessStep: React.FC<ProcessStepProps> = ({ number, title, description, isLast = false, delay = 0 }) => {
  return (
    <FadeIn delay={delay} direction="left">
      <div className="flex flex-col md:flex-row gap-6 md:gap-12 relative group">
        {/* Connector Line */}
        {!isLast && (
          <div className="hidden md:block absolute left-[2.5rem] top-[3.5rem] bottom-[-2rem] w-px bg-sage-border group-hover:bg-sage-primary transition-colors"></div>
        )}
        
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-full border border-sage-border bg-sage-surface flex items-center justify-center text-2xl font-serif text-sage-primary shadow-sm group-hover:border-sage-primary group-hover:text-white group-hover:bg-sage-primary group-hover:scale-110 transition-all duration-300">
            {number}
          </div>
        </div>
        
        <div className="flex flex-col justify-center pb-8 md:pb-12">
          <h3 className="text-xl font-medium text-sage-text mb-2 group-hover:text-sage-primary transition-colors">{title}</h3>
          <p className="text-sage-muted leading-relaxed max-w-2xl">{description}</p>
        </div>
      </div>
    </FadeIn>
  );
};

export default ProcessStep;