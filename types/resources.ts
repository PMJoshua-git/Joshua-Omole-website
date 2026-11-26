export type ResourceStatus = 'published' | 'coming-soon' | 'draft';

export interface ResourceFaqItem {
  question: string;
  answer: string;
}

export interface ResourcePublic {
  slug: string;
  title: string;
  h1?: string;
  seoTitle?: string;
  seoDescription?: string;
  summary: string;
  description: string[];
  includes?: string[];
  audience?: string;
  howToUse?: string;
  related?: string[];
  faq?: ResourceFaqItem[];
  category: string;
  format: string;
  formatType?: string;
  readingTime?: string;
  publishedAt?: string;
  updatedAt?: string;
  coverImage?: string;
  coverImageAlt?: string;
  ogImage?: string;
  status: ResourceStatus;
  featured?: boolean;
  order: number;
}
