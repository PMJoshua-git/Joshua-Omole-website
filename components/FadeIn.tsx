import React from 'react';
import RevealOnScroll, { RevealOnScrollProps } from './RevealOnScroll';

export interface FadeInProps extends Omit<RevealOnScrollProps, 'children'> {
  children: React.ReactNode;
}

const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  direction = 'up',
  distance = 20,
  duration = 550,
  className = '',
  fullWidth = false,
  once = false, // defaults to re-triggering per user preference
  ...rest
}) => {
  return (
    <RevealOnScroll
      delay={delay}
      direction={direction}
      distance={distance}
      duration={duration}
      className={className}
      fullWidth={fullWidth}
      once={once}
      {...rest}
    >
      {children}
    </RevealOnScroll>
  );
};

export default FadeIn;