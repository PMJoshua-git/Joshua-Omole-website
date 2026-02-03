import React, { useEffect, useRef, useState } from 'react';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: 'up' | 'left' | 'right' | 'none';
  fullWidth?: boolean;
}

const FadeIn: React.FC<FadeInProps> = ({ children, delay = 0, className = "", direction = 'up', fullWidth = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (domRef.current) observer.unobserve(domRef.current);
        }
      });
    }, { threshold: 0.1 });
    if (domRef.current) observer.observe(domRef.current);
    return () => {
      if (domRef.current) observer.unobserve(domRef.current);
    }
  }, []);

  const getTranslateClass = () => {
      if (direction === 'up') return 'translate-y-8';
      if (direction === 'left') return '-translate-x-8';
      if (direction === 'right') return 'translate-x-8';
      return '';
  }

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out transform ${fullWidth ? 'w-full' : ''} ${
        isVisible ? 'opacity-100 translate-y-0 translate-x-0' : `opacity-0 ${getTranslateClass()}`
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default FadeIn;