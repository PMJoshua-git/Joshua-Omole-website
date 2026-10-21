import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import Button from './Button';

interface ServiceCardProps {
  title: string;
  description?: string;
  outcomes: string[];
  ctaText: string;
  ctaLink: string;
  isPrimary?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  title, 
  description,
  outcomes, 
  ctaText, 
  ctaLink,
  isPrimary = false
}) => {
  return (
    <div className={`
        flex flex-col h-full p-10 
        transition-all duration-300 rounded-xl border border-sage-border bg-sage-surface text-sage-text shadow-sm
        hover:bg-sage-surface-2 hover:border-sage-primary/30 hover:-translate-y-1
    `}>

      <h3 className="text-2xl font-serif mb-4 min-h-[3rem] items-center flex relative z-10 text-sage-text">
        {title}
      </h3>
      
      {description && (
        <p className="mb-8 text-base leading-relaxed relative z-10 text-sage-muted">
          {description}
        </p>
      )}

      <div className="flex-grow mb-10 relative z-10">
        <ul className="space-y-4">
          {outcomes.map((outcome, index) => (
            <li key={index} className="flex items-start text-sm">
              <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center mr-3 flex-shrink-0 bg-sage-primary/10">
                  <Check className="w-3 h-3 text-sage-primary" />
              </div>
              <span className="text-sage-muted">{outcome}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pt-8 border-t relative z-10 border-sage-border">
        <Button 
          to={ctaLink} 
          variant={isPrimary ? 'primary' : 'outline'} 
          className="w-full justify-between group"
        >
          {ctaText}
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
};

export default ServiceCard;