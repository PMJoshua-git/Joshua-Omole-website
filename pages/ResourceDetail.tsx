import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Check, Copy, CheckCheck, ArrowRight } from 'lucide-react';
import Layout from '../components/Layout';
import FadeIn from '../components/FadeIn';
import Button from '../components/Button';
import { useResources } from '../hooks/useResources';
import { ResourcePublic } from '../types/resources';
import ResourceCard from '../components/resources/ResourceCard';
import GetCopyModal from '../components/resources/GetCopyModal';
import AnimatedCheckmarkList from '../components/animated/AnimatedCheckmarkList';

export const ResourceDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { resources, loading } = useResources();

  const [selectedForModal, setSelectedForModal] = useState<ResourcePublic | null>(null);
  const [copied, setCopied] = useState(false);

  const resource = resources.find((r) => r.slug === slug);

  // If resources are loaded and slug is unknown or not published, redirect to /resources
  useEffect(() => {
    if (!loading) {
      if (!resource || resource.status !== 'published') {
        navigate('/resources', { replace: true });
      }
    }
  }, [loading, resource, navigate]);

  // Set document title for client-side navigation
  useEffect(() => {
    if (resource) {
      document.title = `${resource.title} | Free ${resource.format} from Joshua Omole`;
    }
  }, [resource]);

  const handleCopyLink = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://joshuaomole.com';
    const canonicalUrl = `${origin}/resources/${resource?.slug || ''}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(canonicalUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = canonicalUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy link', e);
    }
  };

  if (loading || !resource) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 animate-pulse">
          <div className="w-32 h-4 bg-sage-surface-2 rounded mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 space-y-6">
              <div className="w-24 h-4 bg-sage-surface-2 rounded"></div>
              <div className="w-full h-12 bg-sage-surface-2 rounded-lg"></div>
              <div className="w-3/4 h-6 bg-sage-surface-2 rounded"></div>
              <div className="w-full h-40 bg-sage-surface-2 rounded-xl"></div>
            </div>
            <div className="lg:col-span-5">
              <div className="w-full aspect-[4/3] bg-sage-surface-2 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Get up to 2 other published resources for "More resources" block
  const otherResources = resources
    .filter((r) => r.slug !== resource.slug && r.status === 'published')
    .slice(0, 2);

  return (
    <>
      <Helmet>
        <title>{`${resource.title} | Free ${resource.format} from Joshua Omole`}</title>
        <meta name="description" content={resource.summary} />
        <meta property="og:title" content={`${resource.title} | Free ${resource.format} from Joshua Omole`} />
        <meta property="og:description" content={resource.summary} />
        <meta property="og:url" content={`https://joshuaomole.com/resources/${resource.slug}`} />
        <meta property="og:type" content="article" />
        {resource.coverImage && (
          <meta property="og:image" content={`https://joshuaomole.com${resource.coverImage}`} />
        )}
        <link rel="canonical" href={`https://joshuaomole.com/resources/${resource.slug}`} />
      </Helmet>

      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          {/* Back link */}
          <div className="mb-8">
            <Link
              to="/resources"
              className="inline-flex items-center text-sm font-medium text-sage-primary hover:text-sage-primary-hover transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
              All resources
            </Link>
          </div>

          {/* Main 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* Content Column (Left on desktop) */}
            <div className="lg:col-span-7 flex flex-col order-1 lg:order-1">
              <FadeIn direction="up">
                {/* Category eyebrow */}
                {resource.category && (
                  <span className="font-heading text-xs font-semibold tracking-[0.12em] uppercase text-sage-primary block mb-3">
                    {resource.category}
                  </span>
                )}

                {/* H1 Title */}
                <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-sage-text leading-[1.15] mb-5">
                  {resource.title}
                </h1>

                {/* Summary */}
                <p className="font-body text-base sm:text-lg text-sage-text/75 leading-relaxed mb-6">
                  {resource.summary}
                </p>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 mb-8 pb-6 border-b border-sage-border/60">
                  <span className="text-xs font-medium bg-sage-surface border border-sage-border text-sage-primary rounded-full px-3 py-1">
                    {resource.format}
                  </span>
                  {resource.readingTime && (
                    <span className="text-xs font-body text-sage-muted">
                      {resource.readingTime}
                    </span>
                  )}
                </div>

                {/* Mobile-only CTA & Cover (stacked in mobile order: title block, CTA, cover, content) */}
                <div className="lg:hidden mb-10 space-y-6">
                  <div className="bg-sage-surface border border-sage-border rounded-2xl p-5 shadow-sm">
                    {/* Cover image or placeholder */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-sage-surface-2 border border-sage-border mb-5 flex items-center justify-center">
                      {resource.coverImage ? (
                        <img
                          src={resource.coverImage}
                          alt={resource.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-heading text-5xl font-bold text-sage-primary/30 uppercase select-none">
                          {resource.format || 'PDF'}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedForModal(resource)}
                      className="w-full bg-sage-primary text-white font-body text-base font-medium py-3.5 rounded-lg hover:bg-sage-primary-hover active:scale-[0.98] transition-all min-h-[48px] shadow-sm mb-2"
                    >
                      Get your free copy
                    </button>
                    <p className="text-xs text-sage-muted text-center mb-4">
                      We'll email it to you right away. No spam.
                    </p>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full flex items-center justify-center text-xs font-medium text-sage-primary hover:text-sage-primary-hover py-2 transition-colors"
                    >
                      {copied ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-sage-primary" />
                          Link copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1.5" />
                          Copy link
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* What's inside section */}
                {resource.includes && resource.includes.length > 0 && (
                  <div className="mb-10 bg-sage-surface border border-sage-border rounded-xl p-6 sm:p-7">
                    <h2 className="font-heading text-xl font-bold text-sage-text mb-4">
                      What's inside
                    </h2>
                    <AnimatedCheckmarkList
                      items={resource.includes}
                      className="space-y-3"
                      itemClassName="flex items-start"
                      variant="circle-badge"
                      textClassName="font-body text-sm sm:text-base text-sage-text/90 leading-relaxed"
                    />
                  </div>
                )}

                {/* Description paragraphs */}
                <div className="max-w-prose space-y-5">
                  {resource.description.map((paragraph, idx) => (
                    <p key={idx} className="font-body text-base leading-relaxed text-sage-text/85">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </FadeIn>
            </div>

            {/* Aside Column (Desktop Sticky Card) */}
            <div className="hidden lg:block lg:col-span-5 order-2">
              <div className="lg:sticky lg:top-24 bg-sage-surface border border-sage-border rounded-2xl p-6 shadow-sm">
                {/* Cover image or placeholder */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-sage-surface-2 border border-sage-border mb-6 flex items-center justify-center">
                  {resource.coverImage ? (
                    <img
                      src={resource.coverImage}
                      alt={resource.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full p-6 text-center select-none">
                      <span className="font-heading text-5xl font-bold tracking-tight text-sage-primary/30 uppercase">
                        {resource.format || 'PDF'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary CTA */}
                <button
                  type="button"
                  onClick={() => setSelectedForModal(resource)}
                  className="w-full bg-sage-primary text-white font-body text-base font-medium py-3.5 rounded-lg hover:bg-sage-primary-hover active:scale-[0.98] transition-all min-h-[48px] shadow-sm mb-2.5 cursor-pointer"
                >
                  Get your free copy
                </button>
                <p className="text-xs text-sage-muted text-center mb-4">
                  We'll email it to you right away. No spam.
                </p>

                {/* Copy link button */}
                <div className="border-t border-sage-border/60 pt-3">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full flex items-center justify-center text-xs font-medium text-sage-primary hover:text-sage-primary-hover py-2 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-sage-primary" />
                        Link copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Copy link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* More resources section */}
          {otherResources.length > 0 && (
            <div className="mt-20 sm:mt-24 pt-12 border-t border-sage-border">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-sage-text">
                  More resources
                </h2>
                <Link
                  to="/resources"
                  className="text-sm font-medium text-sage-primary hover:text-sage-primary-hover transition-colors"
                >
                  View all →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl">
                {otherResources.map((item) => (
                  <ResourceCard
                    key={item.slug}
                    resource={item}
                    onRequest={(res) => setSelectedForModal(res)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Closing audit strip */}
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
        </div>

        {/* Modal */}
        {selectedForModal && (
          <GetCopyModal
            key={selectedForModal.slug}
            resource={selectedForModal}
            onClose={() => setSelectedForModal(null)}
          />
        )}
      </Layout>
    </>
  );
};

export default ResourceDetail;
