import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as HelmetAsync from 'react-helmet-async';
import { ArrowLeft, Copy, CheckCheck, ArrowRight, ChevronRight } from 'lucide-react';

const Helmet = (HelmetAsync as any).Helmet ?? (HelmetAsync as any).default?.Helmet;
import Layout from '../components/Layout';
import FadeIn from '../components/FadeIn';
import Button from '../components/Button';
import { useResources } from '../hooks/useResources';
import { ResourcePublic } from '../types/resources';
import ResourceCard from '../components/resources/ResourceCard';
import GetCopyModal from '../components/resources/GetCopyModal';
import AnimatedCheckmarkList from '../components/animated/AnimatedCheckmarkList';
import {
  CANONICAL_SITE_URL,
  resolveRelatedResources,
  resolveResourceH1,
  resolveResourceOgImageUrl,
  resolveResourceSeoDescription,
  resolveResourceSeoTitle,
  safeJsonLdStringify,
} from '../utils/resourceSeo';

export const ResourceDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { resources, loading } = useResources();

  const [selectedForModal, setSelectedForModal] = useState<ResourcePublic | null>(null);
  const [copied, setCopied] = useState(false);

  const resource = resources.find((r) => r.slug === slug);
  const isPublished = Boolean(resource && resource.status === 'published');
  const isNotFound = !loading && !isPublished;

  const h1Text = resource ? resolveResourceH1(resource) : '';
  const seoTitle = resource ? resolveResourceSeoTitle(resource) : 'Resource Not Found | Joshua Omole';
  const seoDescription = resource
    ? resolveResourceSeoDescription(resource)
    : 'This resource could not be found or is no longer available. Browse all free operational resources from Joshua Omole.';
  const ogImageUrl = resource ? resolveResourceOgImageUrl(resource, CANONICAL_SITE_URL) : '';
  const canonicalUrl = resource ? `${CANONICAL_SITE_URL}/resources/${resource.slug}` : '';

  // Update document title and #ssr-jsonld on client navigation
  useEffect(() => {
    if (loading) return;

    if (isNotFound || !resource || !isPublished) {
      document.title = 'Resource Not Found | Joshua Omole';
      const existingScript = document.getElementById('ssr-jsonld');
      if (existingScript) {
        existingScript.remove();
      }
      return;
    }

    document.title = seoTitle;
    const siteUrl = CANONICAL_SITE_URL;
    const resourceUrl = `${siteUrl}/resources/${resource.slug}`;
    const docNode: Record<string, unknown> = {
      '@type': 'DigitalDocument',
      '@id': `${resourceUrl}#document`,
      name: h1Text,
      description: seoDescription,
      url: resourceUrl,
      image: ogImageUrl,
      author: { '@id': `${siteUrl}/#person` },
      inLanguage: 'en',
      isAccessibleForFree: true,
    };
    if (resource.format) {
      docNode.encodingFormat = /pdf/i.test(resource.format) ? 'application/pdf' : resource.format;
    }
    if (resource.publishedAt) {
      docNode.datePublished = resource.publishedAt;
    }
    if (resource.updatedAt || resource.publishedAt) {
      docNode.dateModified = resource.updatedAt || resource.publishedAt;
    }

    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          '@id': `${siteUrl}/#person`,
          name: 'Joshua Omole',
          url: `${siteUrl}/`,
          jobTitle: 'Business Operations & AI Systems Strategist',
        },
        {
          '@type': 'WebSite',
          '@id': `${siteUrl}/#website`,
          url: `${siteUrl}/`,
          name: 'Joshua Omole',
          publisher: { '@id': `${siteUrl}/#person` },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${resourceUrl}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: 'Resources', item: `${siteUrl}/resources` },
            { '@type': 'ListItem', position: 3, name: h1Text, item: resourceUrl },
          ],
        },
        {
          '@type': 'WebPage',
          '@id': `${resourceUrl}#webpage`,
          url: resourceUrl,
          name: seoTitle,
          description: seoDescription,
          isPartOf: { '@id': `${siteUrl}/#website` },
          breadcrumb: { '@id': `${resourceUrl}#breadcrumb` },
          mainEntity: docNode,
        },
      ],
    };

    let script = document.getElementById('ssr-jsonld') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'ssr-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = safeJsonLdStringify(jsonLd);
  }, [loading, isNotFound, isPublished, resource, seoTitle, seoDescription, h1Text, ogImageUrl]);

  const handleCopyLink = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : CANONICAL_SITE_URL;
    const shareUrl = `${origin}/resources/${resource?.slug || ''}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
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

  if (loading) {
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

  if (isNotFound || !resource || !isPublished) {
    return (
      <>
        <Helmet>
          <title>Resource Not Found | Joshua Omole</title>
          <meta name="robots" content="noindex, nofollow" />
          <meta
            name="description"
            content="This resource could not be found or is no longer available. Browse all free operational resources from Joshua Omole."
          />
        </Helmet>
        <Layout>
          <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-sage-text mb-4">
              Resource not found
            </h1>
            <p className="font-body text-base text-sage-muted mb-8">
              This resource could not be found or is no longer available.
            </p>
            <Link
              to="/resources"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-sage-primary text-white font-body text-sm font-medium hover:bg-sage-primary-hover transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Resources
            </Link>
          </section>
        </Layout>
      </>
    );
  }

  const relatedResources = resolveRelatedResources(resource, resources, 3);
  const coverAlt = resource.coverImageAlt || resource.title;

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={ogImageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          {/* Visible Breadcrumb matching JSON-LD BreadcrumbList */}
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm font-body text-sage-muted">
              <li>
                <Link to="/" className="hover:text-sage-primary transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="w-3.5 h-3.5" />
              </li>
              <li>
                <Link to="/resources" className="hover:text-sage-primary transition-colors">
                  Resources
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="w-3.5 h-3.5" />
              </li>
              <li aria-current="page" className="text-sage-text font-medium truncate max-w-[260px] sm:max-w-md">
                {h1Text}
              </li>
            </ol>
          </nav>

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
                  {h1Text}
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

                {/* Mobile-only CTA & Cover */}
                <div className="lg:hidden mb-10 space-y-6">
                  <div className="bg-sage-surface border border-sage-border rounded-2xl p-5 shadow-sm">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-sage-surface-2 border border-sage-border mb-5 flex items-center justify-center">
                      {resource.coverImage ? (
                        <img
                          src={resource.coverImage}
                          alt={coverAlt}
                          width={1200}
                          height={900}
                          decoding="async"
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
                      We&apos;ll email it to you right away. No spam.
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

                {/* Who it's for section */}
                {resource.audience && (
                  <section className="mb-8">
                    <h2 className="font-heading text-xl font-bold text-sage-text mb-2.5">
                      Who it&apos;s for
                    </h2>
                    <p className="font-body text-base leading-relaxed text-sage-text/85">
                      {resource.audience}
                    </p>
                  </section>
                )}

                {/* What's inside section */}
                {resource.includes && resource.includes.length > 0 && (
                  <section className="mb-10 bg-sage-surface border border-sage-border rounded-xl p-6 sm:p-7">
                    <h2 className="font-heading text-xl font-bold text-sage-text mb-4">
                      What&apos;s inside
                    </h2>
                    <AnimatedCheckmarkList
                      items={resource.includes}
                      className="space-y-3"
                      itemClassName="flex items-start"
                      variant="circle-badge"
                      textClassName="font-body text-sm sm:text-base text-sage-text/90 leading-relaxed"
                    />
                  </section>
                )}

                {/* How to use it + Description paragraphs */}
                {(resource.howToUse || (resource.description && resource.description.length > 0)) && (
                  <section className="max-w-prose space-y-5 mb-10">
                    <h2 className="font-heading text-xl font-bold text-sage-text">
                      How to use it
                    </h2>
                    {resource.howToUse && (
                      <p className="font-body text-base leading-relaxed text-sage-text/90 font-medium">
                        {resource.howToUse}
                      </p>
                    )}
                    {resource.description.map((paragraph, idx) => (
                      <p key={idx} className="font-body text-base leading-relaxed text-sage-text/85">
                        {paragraph}
                      </p>
                    ))}
                  </section>
                )}

                {/* Optional FAQ section */}
                {resource.faq && resource.faq.length > 0 && (
                  <section className="max-w-prose pt-6 border-t border-sage-border/60 space-y-5">
                    <h2 className="font-heading text-xl font-bold text-sage-text">
                      Frequently asked questions
                    </h2>
                    <div className="space-y-5">
                      {resource.faq.map((item, idx) => (
                        <article key={idx} className="space-y-1.5">
                          <h3 className="font-heading text-base font-semibold text-sage-text">
                            {item.question}
                          </h3>
                          <p className="font-body text-sm sm:text-base leading-relaxed text-sage-text/85">
                            {item.answer}
                          </p>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
              </FadeIn>
            </div>

            {/* Aside Column (Desktop Sticky Card) */}
            <div className="hidden lg:block lg:col-span-5 order-2">
              <div className="lg:sticky lg:top-24 bg-sage-surface border border-sage-border rounded-2xl p-6 shadow-sm">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-sage-surface-2 border border-sage-border mb-6 flex items-center justify-center">
                  {resource.coverImage ? (
                    <img
                      src={resource.coverImage}
                      alt={coverAlt}
                      width={1200}
                      height={900}
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
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

                <button
                  type="button"
                  onClick={() => setSelectedForModal(resource)}
                  className="w-full bg-sage-primary text-white font-body text-base font-medium py-3.5 rounded-lg hover:bg-sage-primary-hover active:scale-[0.98] transition-all min-h-[48px] shadow-sm mb-2.5 cursor-pointer"
                >
                  Get your free copy
                </button>
                <p className="text-xs text-sage-muted text-center mb-4">
                  We&apos;ll email it to you right away. No spam.
                </p>

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

          {/* Related resources section (up to 3) */}
          {relatedResources.length > 0 && (
            <section className="mt-20 sm:mt-24 pt-12 border-t border-sage-border">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-sage-text">
                  Related resources
                </h2>
                <Link
                  to="/resources"
                  className="text-sm font-medium text-sage-primary hover:text-sage-primary-hover transition-colors"
                >
                  View all &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedResources.map((item) => (
                  <ResourceCard
                    key={item.slug}
                    resource={item}
                    onRequest={(res) => setSelectedForModal(res)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Closing audit strip */}
          <div className="mt-20 sm:mt-24 p-8 sm:p-10 rounded-2xl bg-sage-primary text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="text-center md:text-left">
              <h2 className="font-heading text-xl sm:text-2xl font-bold mb-2">
                Want this built into how your business runs?
              </h2>
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
