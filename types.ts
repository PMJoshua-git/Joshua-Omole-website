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

export interface Resource {
  id: string;
  title: string;
  category: string;
  shortDescription: string;
  longDescription: string;
  coverImageUrl: string;
  downloadUrl?: string; // from Airtable mapping
  estimatedReadingTime: string;
  format: string;
  displayOrder: number;
  featured: boolean;
  status: 'Draft' | 'Coming Soon' | 'Published' | 'Archived';
  socialProofCount: number;
  createdDate: string;
}

export interface TrainingSession {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  thumbnail: string;
  priceTierA: number;
  priceTierB: number;
  durationHours: number;
  whatYouGet: string;
  monthlyEnrollments: number;
  calBookingLink: string;
  isPublished: boolean;
  displayOrder: number;
}

export interface ChildrenProps {
  children: ReactNode;
}