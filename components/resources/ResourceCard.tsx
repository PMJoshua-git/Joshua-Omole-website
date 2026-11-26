import React from 'react';
import { Link } from 'react-router-dom';
import { ResourcePublic } from '../../types/resources';

interface ResourceCardProps {
  resource: ResourcePublic;
  onRequest: (resource: ResourcePublic) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onRequest }) => {
  const isComingSoon = resource.status === 'coming-soon';

  const cardContent = (
    <>
      {/* Cover area (aspect-[4/3]) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sage-surface-2 border-b border-sage-border flex items-center justify-center">
        {resource.coverImage ? (
          <img
            src={resource.coverImage}
            alt={resource.coverImageAlt || resource.title}
            width={1200}
            height={900}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full p-6 text-center select-none">
            <span className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-sage-primary/30 uppercase">
              {resource.format || 'PDF'}
            </span>
          </div>
        )}

        {/* Top-left badge */}
        <div className="absolute top-3 left-3 z-10">
          {isComingSoon ? (
            <span className="text-xs font-medium bg-sage-surface/95 border border-sage-border text-sage-muted rounded-full px-2.5 py-1 shadow-xs">
              Coming soon
            </span>
          ) : (
            <span className="text-xs font-medium bg-sage-surface/95 border border-sage-border text-sage-primary rounded-full px-2.5 py-1 shadow-xs">
              {resource.format || 'PDF'}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-grow flex flex-col">
        {resource.category && (
          <span className="font-heading text-[11px] font-semibold tracking-[0.12em] uppercase text-sage-primary block mb-2">
            {resource.category}
          </span>
        )}

        <h3 className="font-heading text-lg font-semibold text-sage-text mb-2.5 line-clamp-2 leading-snug group-hover:text-sage-primary transition-colors">
          {resource.title}
        </h3>

        <p className="font-body text-sm text-sage-muted line-clamp-3 leading-relaxed mb-4 flex-grow">
          {resource.summary}
        </p>

        {resource.readingTime && (
          <div className="text-xs text-sage-text/60 font-body mt-auto pt-2 border-t border-sage-border/50">
            {resource.readingTime}
          </div>
        )}
      </div>
    </>
  );

  return (
    <article className="card-interaction bg-sage-surface border border-sage-border rounded-xl overflow-hidden flex flex-col h-full hover:border-sage-primary/40 hover:shadow-sm transition group">
      {/* (a) Link wrapper for clickable content if published; static div if coming soon */}
      {isComingSoon ? (
        <div className="flex-grow flex flex-col opacity-85 cursor-default">
          {cardContent}
        </div>
      ) : (
        <Link
          to={`/resources/${resource.slug}`}
          className="flex-grow flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-primary"
        >
          {cardContent}
        </Link>
      )}

      {/* (b) Footer row with button */}
      <div className="px-5 pb-5 mt-auto pt-1">
        {isComingSoon ? (
          <div className="w-full text-center py-2.5 text-xs font-medium text-sage-muted bg-sage-surface-2/60 border border-sage-border rounded-lg min-h-[44px] flex items-center justify-center select-none">
            Coming soon
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onRequest(resource)}
            className="w-full bg-sage-primary text-white font-body text-sm font-medium py-2.5 rounded-lg hover:bg-sage-primary-hover active:scale-[0.98] transition-all min-h-[44px] flex items-center justify-center shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-primary focus-visible:ring-offset-1"
          >
            Get your free copy
          </button>
        )}
      </div>
    </article>
  );
};

export default ResourceCard;
