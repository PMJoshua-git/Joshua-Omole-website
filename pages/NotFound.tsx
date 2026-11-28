import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as HelmetAsync from 'react-helmet-async';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import {
  ErrorMessageEntry,
  saveLastErrorMessageId,
  selectRandomErrorMessage,
} from '../data/errorMessages';

const Helmet = (HelmetAsync as any).Helmet ?? (HelmetAsync as any).default?.Helmet;

const NOT_FOUND_TITLE = '404 — Page Not Found | Joshua Omole';
const NOT_FOUND_DESCRIPTION =
  'The page you are looking for could not be found. Return home or view services on JoshuaOmole.com.';

const BrokenRouteMark: React.FC = () => (
  <svg
    viewBox="0 0 160 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="not-found-mark w-36 h-7 mx-auto mb-6 text-sage-primary"
  >
    <line x1="16" y1="14" x2="60" y2="14" stroke="#DDE3DE" strokeWidth="1.5" />
    <line
      x1="60"
      y1="14"
      x2="100"
      y2="14"
      stroke="#55745C"
      strokeWidth="1.5"
      strokeDasharray="4 4"
      strokeLinecap="round"
    />
    <line x1="100" y1="14" x2="144" y2="14" stroke="#DDE3DE" strokeWidth="1.5" />
    <circle cx="16" cy="14" r="4" fill="#EEF4EF" stroke="#55745C" strokeWidth="1.5" />
    <circle cx="60" cy="14" r="3" fill="#FFFFFF" stroke="#55745C" strokeWidth="1.5" />
    <circle cx="100" cy="14" r="3" fill="#FFFFFF" stroke="#DDE3DE" strokeWidth="1.5" />
    <circle cx="144" cy="14" r="4" fill="#F4F5F2" stroke="#DDE3DE" strokeWidth="1.5" />
  </svg>
);

const NotFound: React.FC = () => {
  const { pathname } = useLocation();
  const prevPathnameRef = useRef(pathname);

  const [message, setMessage] = useState<ErrorMessageEntry>(() =>
    selectRandomErrorMessage({ persist: false })
  );

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setMessage(selectRandomErrorMessage({ persist: false }));
    }
  }, [pathname]);

  useEffect(() => {
    saveLastErrorMessageId(message.id);
  }, [message.id]);

  useEffect(() => {
    document.title = NOT_FOUND_TITLE;

    const existingJsonLd = document.getElementById('ssr-jsonld');
    if (existingJsonLd) {
      existingJsonLd.remove();
    }

    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }
  }, [pathname]);

  return (
    <>
      <Helmet>
        <title>{NOT_FOUND_TITLE}</title>
        <meta name="description" content={NOT_FOUND_DESCRIPTION} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Layout>
        <section
          aria-labelledby="not-found-heading"
          className="not-found-section min-h-[calc(100vh-16rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 sm:py-28"
        >
          <div className="not-found-container max-w-2xl mx-auto w-full text-center">
            <BrokenRouteMark />

            <p
              aria-label="Error 404"
              className="not-found-code font-mono text-2xl sm:text-3xl font-semibold tracking-[0.18em] text-sage-primary mb-4 select-none"
            >
              404
            </p>

            <h1
              id="not-found-heading"
              className="not-found-headline font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-sage-text tracking-tight leading-[1.15] mb-5 break-words"
            >
              {message.headline}
            </h1>

            <p className="not-found-description font-sans text-base sm:text-lg text-sage-sec leading-relaxed max-w-xl mx-auto mb-4">
              {message.description}
            </p>

            {message.context && (
              <p className="not-found-context font-sans text-sm sm:text-base text-sage-muted leading-relaxed max-w-lg mx-auto mb-10">
                {message.context}
              </p>
            )}

            <div className="not-found-actions flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mt-8">
              <Button
                to="/"
                variant="primary"
                size="default"
                className="not-found-btn not-found-btn--primary w-full sm:w-auto min-w-[180px] gap-2"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Return Home</span>
              </Button>

              <Button
                to="/services"
                variant="secondary"
                size="default"
                className="not-found-btn not-found-btn--secondary w-full sm:w-auto min-w-[180px] gap-2"
              >
                <span>View my service</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default NotFound;
