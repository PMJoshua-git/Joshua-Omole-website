import React from 'react';
import FadeIn from './FadeIn';

interface QuoteBlockProps {
  quote: string;
  author?: string;
  centered?: boolean;
}

const QuoteBlock: React.FC<QuoteBlockProps> = ({ quote, author, centered = true }) => {
  return (
    <FadeIn className="w-full max-w-5xl mx-auto py-24 px-6">
      <div className={`relative ${centered ? 'text-center' : 'text-left'} bg-sage-surface border border-sage-border rounded-xl p-12 md:p-20 shadow-sm`}>
        <div className="absolute top-10 left-10 md:left-20 text-8xl text-sage-primary/10 font-serif leading-none z-0 select-none">
          &ldquo;
        </div>
        <h2 className="relative z-10 text-3xl md:text-5xl font-serif text-sage-text leading-tight">
          {quote}
        </h2>
        {author && (
          <p className="mt-8 text-sm md:text-base text-sage-muted font-medium tracking-wide uppercase">
            — {author}
          </p>
        )}
      </div>
    </FadeIn>
  );
};

export default QuoteBlock;