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
        transition-all duration-300 rounded-[2rem] 
        ${isPrimary 
            ? 'bg-gradient-to-br from-navy to-midnight text-white shadow-glow border border-blue/30 relative overflow-hidden' 
            : 'bg-midnight/50 border border-navy text-white shadow-lg hover:shadow-glow hover:-translate-y-2 hover:border-blue/50'
        }
    `}>
      {/* Background flare for primary */}
      {isPrimary && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple/20 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
      )}

      <h3 className={`text-2xl font-serif mb-4 min-h-[3rem] items-center flex relative z-10 ${isPrimary ? 'text-white' : 'text-white'}`}>
        {title}
      </h3>
      
      {description && (
        <p className={`mb-8 text-base leading-relaxed relative z-10 ${isPrimary ? 'text-silver' : 'text-silver'}`}>
          {description}
        </p>
      )}

      <div className="flex-grow mb-10 relative z-10">
        <ul className="space-y-4">
          {outcomes.map((outcome, index) => (
            <li key={index} className="flex items-start text-sm">
              <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${isPrimary ? 'bg-white/10' : 'bg-blue/10'}`}>
                  <Check className={`w-3 h-3 ${isPrimary ? 'text-white' : 'text-blue'}`} />
              </div>
              <span className={isPrimary ? 'text-silver' : 'text-silver'}>{outcome}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={`mt-auto pt-8 border-t relative z-10 ${isPrimary ? 'border-white/10' : 'border-navy'}`}>
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