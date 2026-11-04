import React, { useState } from 'react';
import Layout from '../components/Layout';
import FadeIn from '../components/FadeIn';
import Button from '../components/Button';
import { Helmet } from 'react-helmet-async';
import { Search, AlertCircle, ArrowRight } from 'lucide-react';
import { useResources } from '../hooks/useResources';
import { ResourcePublic } from '../types/resources';
import ResourceCard from '../components/resources/ResourceCard';
import GetCopyModal from '../components/resources/GetCopyModal';

const KnowledgeHub: React.FC = () => {
  const { resources, loading, error } = useResources();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedResourceForModal, setSelectedResourceForModal] = useState<ResourcePublic | null>(null);

  // Filter unique categories
  const categories = Array.from(
    new Set(resources.map((r) => r.category).filter(Boolean))
  );

  const filteredResources = selectedCategory === 'All'
    ? resources
    : resources.filter((r) => r.category === selectedCategory);

  const featuredResources = resources.filter((r) => r.featured && r.status === 'published');

  return (
    <>
      <Helmet>
        <title>Resources | Joshua Omole</title>
        <meta name="description" content="Free guides, frameworks, and operational resources built specifically for business owners who want to understand AI and systems without the noise. Practical resources you can apply to your operation today." />
        <meta property="og:title" content="Resources — Free Operational Resources | Joshua Omole" />
        <meta property="og:description" content="Free guides, frameworks, and resources for SME founders and operators. Stop searching. Start implementing." />
        <meta property="og:url" content="https://joshuaomole.com/resources" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://joshuaomole.com/images/joshua-portrait.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Resources — Free Operational Resources | Joshua Omole" />
        <meta name="twitter:description" content="Free guides, frameworks, and resources for SME founders. Practical. Applicable. Built for real business operations." />
        <link rel="canonical" href="https://joshuaomole.com/resources" />
      </Helmet>

      <Layout>
        {/* Hero Section — Keeping original page copy as requested */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-16 sm:pb-20 max-w-7xl mx-auto overflow-hidden text-center min-h-[45vh] flex flex-col items-center justify-center">
          {/* Subtle Glow Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-sage-soft rounded-full blur-[150px] opacity-20 pointer-events-none" />

          <FadeIn direction="up" className="relative z-10 w-full max-w-4xl mx-auto">
            <div className="font-mono text-sage-primary mb-6 tracking-widest text-xs font-semibold uppercase border border-sage-border inline-block px-4 py-1.5 rounded-full bg-sage-surface-2">
              Resource Library
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-sage-text leading-tight mb-8">
              Practical Resources for <br /> <span className="text-sage-primary">Smarter Business Operations</span>
            </h1>
            <p className="text-lg md:text-xl text-sage-muted leading-relaxed mb-12 max-w-2xl mx-auto">
              Explore practical guides, frameworks, and implementation resources designed to help leaders understand AI, design better systems, and build operations that actually scale.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button
                onClick={() => {
                  const element = document.getElementById('resources');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                variant="primary"
                size="large"
                className="w-full sm:w-auto"
              >
                Browse Resources <Search className="ml-2 w-5 h-5" />
              </Button>
              <Button to="/newsletter" variant="outline" size="large" className="w-full sm:w-auto">
                Join Newsletter
              </Button>
            </div>
          </FadeIn>
        </section>

        {/* Main Content Area */}
        <section id="resources" className="px-4 sm:px-6 lg:px-8 pb-28 max-w-6xl mx-auto relative z-10">
          
          {/* Featured Section (Featured Card if any) */}
          {!loading && !error && featuredResources.length > 0 && selectedCategory === 'All' && (
            <div className="mb-14 sm:mb-18">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <span className="font-heading text-xs font-semibold tracking-[0.12em] uppercase text-sage-primary block mb-1">
                    Featured
                  </span>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-sage-text">
                    Featured Resources
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredResources.slice(0, 2).map((item) => (
                  <ResourceCard
                    key={`featured-${item.slug}`}
                    resource={item}
                    onRequest={(res) => setSelectedResourceForModal(res)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Category Filter Chips (rendered if more than 1 category) */}
          {!loading && !error && categories.length > 1 && (
            <div className="mb-10 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex items-center gap-2 whitespace-nowrap min-w-max">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === 'All'
                      ? 'bg-sage-primary text-white shadow-xs'
                      : 'bg-sage-surface border border-sage-border text-sage-text hover:border-sage-primary/40 hover:bg-sage-surface-2'
                  }`}
                >
                  All ({resources.length})
                </button>
                {categories.map((cat) => {
                  const count = resources.filter((r) => r.category === cat).length;
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-sage-primary text-white shadow-xs'
                          : 'bg-sage-surface border border-sage-border text-sage-text hover:border-sage-primary/40 hover:bg-sage-surface-2'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-sage-surface border border-sage-border rounded-xl overflow-hidden h-[380px] flex flex-col">
                  <div className="aspect-[4/3] bg-sage-surface-2" />
                  <div className="p-5 space-y-3 flex-grow">
                    <div className="h-3 w-20 bg-sage-surface-2 rounded" />
                    <div className="h-5 w-3/4 bg-sage-surface-2 rounded" />
                    <div className="h-3 w-full bg-sage-surface-2 rounded" />
                    <div className="h-3 w-5/6 bg-sage-surface-2 rounded" />
                  </div>
                  <div className="p-5 pt-0">
                    <div className="h-10 w-full bg-sage-surface-2 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-sage-muted border border-sage-border rounded-xl bg-sage-surface shadow-sm text-center px-4">
              <AlertCircle className="w-8 h-8 text-red-500/80 mb-3" />
              <p className="font-body text-sm text-sage-text max-w-md">
                Unable to load resources at this time. Please check your connection and reload.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredResources.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-sage-muted border border-sage-border rounded-xl bg-sage-surface shadow-sm text-center px-4">
              <AlertCircle className="w-8 h-8 text-sage-primary/60 mb-3" />
              <p className="font-body text-base text-sage-text font-medium">
                Unable to load resources at the moment, Please Check back later
              </p>
            </div>
          )}

          {/* Redesigned Resources Grid (RWD-RES-01: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3) */}
          {!loading && !error && filteredResources.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {filteredResources.map((item) => (
                <ResourceCard
                  key={item.slug}
                  resource={item}
                  onRequest={(res) => setSelectedResourceForModal(res)}
                />
              ))}
            </div>
          )}

          {/* Closing Strip */}
          <div className="mt-20 sm:mt-24 p-8 sm:p-10 rounded-2xl bg-sage-primary text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="text-center md:text-left">
              <h3 className="font-heading text-xl sm:text-2xl font-bold mb-2">
                Want this built into how your business runs?
              </h3>
              <p className="font-body text-sm sm:text-base text-white/80 max-w-xl">
                Book a 30-minute operational clarity audit to identify bottlenecks and design cleaner workflow execution.
              </p>
            </div>
            <div className="shrink-0 w-full md:w-auto">
              <Button
                to="/audit"
                variant="secondary"
                size="large"
                className="w-full md:w-auto bg-white text-sage-primary hover:bg-sage-surface border-white"
              >
                Book a free audit <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Modal */}
        {selectedResourceForModal && (
          <GetCopyModal
            key={selectedResourceForModal.slug}
            resource={selectedResourceForModal}
            onClose={() => setSelectedResourceForModal(null)}
          />
        )}
      </Layout>
    </>
  );
};

export default KnowledgeHub;
