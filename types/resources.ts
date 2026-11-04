export type ResourceStatus = 'published' | 'coming-soon' | 'draft';

export interface ResourcePublic {
  slug: string;
  title: string;
  summary: string;
  description: string[];
  includes?: string[];
  category: string;
  format: string;
  readingTime?: string;
  coverImage?: string;
  status: ResourceStatus;
  featured?: boolean;
  order: number;
}
