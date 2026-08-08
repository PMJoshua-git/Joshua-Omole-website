import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => {
  return (
    <div className={`shimmer bg-navy/20 border border-navy/30 rounded-xl ${className}`}></div>
  );
};

export const ResourceCardSkeleton: React.FC = () => {
  return (
    <div className="bg-midnight/50 p-6 rounded-[2rem] border border-navy flex flex-col h-full shadow-lg relative overflow-hidden opacity-75">
      {/* Visual Image Placeholder */}
      <div className="relative mb-6 h-48 w-full rounded-xl border border-white/5 bg-navy/10 flex items-center justify-center overflow-hidden">
        <div className="shimmer absolute inset-0 w-full h-full"></div>
      </div>

      <div className="flex-grow flex flex-col">
        {/* Category Tag */}
        <div className="mb-3">
          <div className="shimmer h-6 w-24 rounded-full bg-purple/10 border border-purple/20"></div>
        </div>
        
        {/* Title Lines */}
        <div className="space-y-2 mb-4">
          <div className="shimmer h-6 w-3/4 bg-navy/20 rounded-md"></div>
          <div className="shimmer h-6 w-1/2 bg-navy/20 rounded-md"></div>
        </div>

        {/* Short Description Lines */}
        <div className="space-y-2 mb-6 flex-grow">
          <div className="shimmer h-4 w-full bg-navy/10 rounded-md"></div>
          <div className="shimmer h-4 w-11/12 bg-navy/10 rounded-md"></div>
          <div className="shimmer h-4 w-4/5 bg-navy/10 rounded-md"></div>
        </div>

        {/* Button */}
        <div className="mt-auto">
          <div className="shimmer h-12 w-full bg-navy/20 border border-navy/40 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};

export const LiveTrainingSessionSkeleton: React.FC = () => {
  return (
    <div className="bg-midnight border border-navy rounded-[2.5rem] overflow-hidden flex flex-col h-full opacity-75">
      {/* Thumbnail */}
      <div className="w-full aspect-[16/9] bg-navy/10 relative overflow-hidden">
        <div className="shimmer absolute inset-0 w-full h-full"></div>
      </div>
      
      <div className="p-8 flex-grow flex flex-col">
        {/* Title */}
        <div className="shimmer h-7 w-2/3 bg-navy/20 rounded-md mb-3"></div>
        
        {/* Short description */}
        <div className="space-y-2 mb-6 flex-grow mt-2">
          <div className="shimmer h-4 w-full bg-navy/10 rounded-md"></div>
          <div className="shimmer h-4 w-5/6 bg-navy/10 rounded-md"></div>
          <div className="shimmer h-4 w-4/5 bg-navy/10 rounded-md"></div>
        </div>

        <div className="w-full h-px bg-white/5 mb-4 mt-auto"></div>

        {/* Enrollments metric */}
        <div className="shimmer h-4 w-1/2 bg-navy/10 rounded-md"></div>
      </div>
    </div>
  );
};
