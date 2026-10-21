import React, { useState } from 'react';
import { Sparkles, Hand } from 'lucide-react';

interface HeroAvatarMorphProps {
  imageSources: string[];
  onErrorFallbackText?: string;
  className?: string;
}

export const HeroAvatarMorph: React.FC<HeroAvatarMorphProps> = ({
  imageSources,
  onErrorFallbackText = 'J.O',
  className = '',
}) => {
  const [imageIndex, setImageIndex] = useState(0);
  const [isToggledActive, setIsToggledActive] = useState(false);

  const handleImageError = () => {
    if (imageIndex < imageSources.length - 1) {
      setImageIndex((prev) => prev + 1);
    } else {
      setImageIndex(-1); // Use fallback lettermark
    }
  };

  return (
    <div
      className={`avatar-morph-container group relative w-full h-full rounded-[2.5rem] overflow-hidden border border-sage-border shadow-soft bg-sage-surface cursor-pointer select-none ${
        isToggledActive ? 'is-morphed' : ''
      } ${className}`}
      onClick={() => setIsToggledActive((prev) => !prev)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsToggledActive((prev) => !prev);
        }
      }}
      aria-label="Joshua Omole portrait. Hover or tap to reveal avatar."
      title="Hover or tap to reveal avatar"
    >
      {/* ── Layer 1: Normal Photographic Portrait ── */}
      <div className="avatar-layer-photo absolute inset-0 w-full h-full z-10 flex items-center justify-center bg-sage-surface">
        {imageIndex !== -1 ? (
          <img
            src={imageSources[imageIndex]}
            alt="Joshua Omole — Business Operations & AI Systems Strategist"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-sage-primary to-sage-primary-hover flex flex-col items-center justify-center text-white p-6">
            <span className="font-serif italic font-bold text-7xl mb-2">{onErrorFallbackText}</span>
            <span className="text-xs uppercase tracking-widest text-emerald-100 font-semibold">
              Joshua Omole
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-sage-bg/20 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* ── Layer 2: Illustrated Avatar with Waving Hand ── */}
      <div className="avatar-layer-vector absolute inset-0 w-full h-full z-20 flex flex-col items-center justify-center bg-gradient-to-b from-[#E7EFE9] to-[#D5E3D8] p-6">
        {/* Soft background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-sage-primary/15 rounded-full blur-3xl pointer-events-none" />

        {/* Stylized Avatar Illustration */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          <svg
            viewBox="0 0 300 300"
            className="w-full h-full drop-shadow-md"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Halo */}
            <circle cx="150" cy="150" r="130" fill="#2D5A43" fillOpacity="0.08" />
            <circle cx="150" cy="150" r="110" fill="#2D5A43" fillOpacity="0.12" />

            {/* Torso / Jacket */}
            <path
              d="M70 280 C75 220 110 200 150 200 C190 200 225 220 230 280 Z"
              fill="#202A24"
            />
            {/* Inner Shirt Collar */}
            <path d="M125 200 L150 235 L175 200 Z" fill="#EEF4EF" />
            <path d="M135 200 L150 225 L165 200 Z" fill="#2D5A43" />

            {/* Neck */}
            <rect x="135" y="170" width="30" height="35" rx="6" fill="#8D5524" />

            {/* Head / Face */}
            <ellipse cx="150" cy="130" rx="46" ry="52" fill="#996030" />

            {/* Hair */}
            <path
              d="M102 120 C102 75 125 65 150 65 C175 65 198 75 198 120 C198 126 194 122 186 110 C175 95 125 95 114 110 C106 122 102 126 102 120 Z"
              fill="#1A1816"
            />

            {/* Eyebrows */}
            <path
              d="M120 108 Q130 105 140 108"
              stroke="#1A1816"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M160 108 Q170 105 180 108"
              stroke="#1A1816"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Eyes */}
            <circle cx="130" cy="120" r="4" fill="#1A1816" />
            <circle cx="170" cy="120" r="4" fill="#1A1816" />
            <circle cx="131" cy="119" r="1.5" fill="#FFFFFF" />
            <circle cx="171" cy="119" r="1.5" fill="#FFFFFF" />

            {/* Signature Modern Wireframe Glasses */}
            <rect
              x="116"
              y="110"
              width="28"
              height="20"
              rx="6"
              stroke="#202A24"
              strokeWidth="3"
              fill="rgba(255,255,255,0.2)"
            />
            <rect
              x="156"
              y="110"
              width="28"
              height="20"
              rx="6"
              stroke="#202A24"
              strokeWidth="3"
              fill="rgba(255,255,255,0.2)"
            />
            <path d="M144 118 L156 118" stroke="#202A24" strokeWidth="2.5" />
            <path d="M104 116 L116 116" stroke="#202A24" strokeWidth="2.5" />
            <path d="M184 116 L196 116" stroke="#202A24" strokeWidth="2.5" />

            {/* Nose */}
            <path
              d="M149 125 Q153 138 147 142"
              stroke="#7A4418"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Warm confident smile */}
            <path
              d="M135 152 Q150 164 165 152"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              fill="#7A4418"
              strokeLinecap="round"
            />

            {/* Beard & Mustache detail */}
            <path
              d="M138 146 Q150 148 162 146"
              stroke="#1A1816"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M125 150 Q150 178 175 150"
              stroke="#1A1816"
              strokeWidth="2.5"
              strokeDasharray="1 3"
              fill="none"
            />
          </svg>

          {/* ── Inner Waving Hand Loop (.avatar-hand) ── */}
          <div className="avatar-hand absolute right-4 sm:right-6 top-10 sm:top-12 z-30 pointer-events-none">
            <div className="relative bg-white/90 backdrop-blur-xs p-2.5 rounded-full shadow-lg border border-sage-border/50 flex items-center justify-center">
              <span className="text-3xl sm:text-4xl select-none" role="img" aria-label="Waving hand">
                👋
              </span>
            </div>
          </div>
        </div>

        {/* Caption info tag */}
        <div className="mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-sage-border/40 text-sage-primary text-xs font-medium shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-sage-primary" />
          <span>Joshua Omole — AI Systems & Ops</span>
        </div>
      </div>

      {/* Floating interactive indicator chip */}
      <div className="absolute bottom-4 right-4 z-30 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sage-bg/90 backdrop-blur-md text-sage-text text-[11px] font-medium border border-sage-border shadow-xs transition-opacity duration-300 group-hover:opacity-90">
          <Hand className="w-3.5 h-3.5 text-sage-primary animate-pulse" />
          <span>{isToggledActive ? 'Click to view photo' : 'Hover / tap to wave'}</span>
        </span>
      </div>
    </div>
  );
};

export default HeroAvatarMorph;
