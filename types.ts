import { ReactNode } from 'react';

export interface RouteItem {
  name: string;
  path: string;
}

export interface ServiceItem {
  title: string;
  description: string;
  outcomes: string[];
  ctaText: string;
  ctaLink: string;
}

export interface ProcessStepItem {
  number: string;
  title: string;
  description: string;
}

export interface ChildrenProps {
  children: ReactNode;
}