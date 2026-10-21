import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  return (
    <div className={`animate-page-fade ${className}`}>
      {children}
    </div>
  );
};

export default PageTransition;
