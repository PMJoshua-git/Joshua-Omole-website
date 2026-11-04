import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
import Button from './Button';

const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isResourcesMobileOpen, setIsResourcesMobileOpen] = useState(false);
  
  const closeTimer = useRef<number | null>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  // Scroll detection — triggers subtle bottom-border shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer and dropdown on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsResourcesOpen(false);
    setIsResourcesMobileOpen(false);
  }, [location.pathname]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Handle outside clicks for desktop dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) {
        setIsResourcesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isResourcesOpen) {
          setIsResourcesOpen(false);
          triggerRef.current?.focus();
        }
        if (isMenuOpen) {
          setIsMenuOpen(false);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isResourcesOpen, isMenuOpen]);

  // Helper methods for desktop dropdown
  const openResources = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setIsResourcesOpen(true);
  };

  const scheduleClose = () => {
    closeTimer.current = window.setTimeout(() => setIsResourcesOpen(false), 150);
  };

  // Primary standard nav links before Resources dropdown
  const primaryNavLinks = [
    { label: 'Home',     href: '/'        },
    { label: 'About',    href: '/about'   },
    { label: 'Services', href: '/services'},
  ];

  // Helper: is this link the active page?
  const isActive = (href: string) =>
    location.pathname === href ||
    (href !== '/' && location.pathname.startsWith(href));

  const isResourcesActive = location.pathname.startsWith('/resources');

  return (
    <>
      {/* ─── Nav bar ─── */}
      <header
        className={`
          sticky top-0 z-50 w-full
          bg-sage-bg border-b border-sage-border
          transition-shadow duration-200
          ${isScrolled ? 'shadow-[0_1px_8px_rgba(0,0,0,0.06)]' : ''}
        `}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px] lg:h-[64px]">
            {/* ── Logo / Brand ── */}
            <Link
              to="/"
              className="font-heading font-semibold text-[15px]
                         text-sage-primary hover:text-sage-primary-hover
                         transition-colors tracking-[-0.01em]
                         focus-visible:outline-none
                         focus-visible:ring-2
                         focus-visible:ring-sage-primary
                         focus-visible:ring-offset-2
                         rounded-sm"
              aria-label="Joshua Omole — Home"
            >
              Joshua Omole
            </Link>

            {/* ── Desktop links + CTA (hidden below lg) ── */}
            <nav
              className="hidden lg:flex items-center gap-1"
              aria-label="Primary navigation"
            >
              {primaryNavLinks.map(({ label, href }) => (
                <Link
                  key={href}
                  to={href}
                  className={`
                    relative font-body text-sm px-3 py-1.5
                    transition-colors duration-150 rounded-md
                    active:scale-[0.98]
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-sage-primary
                    focus-visible:ring-offset-1
                    ${isActive(href)
                      ? 'text-sage-primary font-medium'
                      : 'text-sage-text hover:text-sage-primary'
                    }
                  `}
                >
                  {label}
                  {/* Active underline indicator */}
                  {isActive(href) && (
                    <span
                      className="absolute bottom-0 left-3 right-3
                                 h-[2px] bg-sage-primary rounded-full
                                 transition-all duration-200"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              ))}

              {/* ── Resources Dropdown (Desktop) ── */}
              <div
                ref={resourcesRef}
                className="relative"
                onMouseEnter={openResources}
                onMouseLeave={scheduleClose}
              >
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={() => setIsResourcesOpen((prev) => !prev)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setIsResourcesOpen((prev) => !prev);
                    }
                  }}
                  aria-haspopup="menu"
                  aria-expanded={isResourcesOpen}
                  className={`
                    relative font-body text-sm px-3 py-1.5 rounded-md
                    transition-colors duration-150 inline-flex items-center gap-1
                    cursor-pointer active:scale-[0.98]
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-sage-primary
                    focus-visible:ring-offset-1
                    ${isResourcesActive
                      ? 'text-sage-primary font-medium'
                      : 'text-sage-text hover:text-sage-primary'
                    }
                  `}
                >
                  <span>Resources</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isResourcesOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                    aria-hidden="true"
                  />
                  {/* Active underline indicator */}
                  {isResourcesActive && (
                    <span
                      className="absolute bottom-0 left-3 right-3
                                 h-[2px] bg-sage-primary rounded-full
                                 transition-all duration-200"
                      aria-hidden="true"
                    />
                  )}
                </button>

                {/* Dropdown panel */}
                {isResourcesOpen && (
                  <div
                    className="absolute left-0 top-full pt-2 z-50"
                    onMouseEnter={openResources}
                    onMouseLeave={scheduleClose}
                  >
                    <div
                      role="menu"
                      aria-label="Resources menu"
                      className="w-72 bg-sage-surface border border-sage-border rounded-xl shadow-md p-2 animate-fade-in"
                    >
                      {/* Item 1: Blog */}
                      <a
                        href="https://blog.joshuaomole.com"
                        role="menuitem"
                        className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-sage-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-primary group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-body text-sm font-medium text-sage-text group-hover:text-sage-primary transition-colors">
                            Blog
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-sage-muted group-hover:text-sage-primary transition-colors" />
                        </div>
                        <p className="font-body text-xs text-sage-muted mt-0.5">
                          Articles on operations and systems
                        </p>
                      </a>

                      {/* Item 2: Resources */}
                      <Link
                        to="/resources"
                        role="menuitem"
                        onClick={() => setIsResourcesOpen(false)}
                        className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-sage-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-primary group"
                      >
                        <div className="font-body text-sm font-medium text-sage-text group-hover:text-sage-primary transition-colors">
                          Resources
                        </div>
                        <p className="font-body text-xs text-sage-muted mt-0.5">
                          Free templates, guides and frameworks
                        </p>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Static Book Audit CTA button */}
              <div className="ml-3">
                <Button
                  to="/audit"
                  variant="primary"
                  size="small"
                  className="font-medium whitespace-nowrap"
                >
                  Book Audit
                </Button>
              </div>
            </nav>

            {/* ── Mobile menu toggle (hidden at lg+) ── */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="lg:hidden flex items-center gap-1.5
                         text-sage-text hover:text-sage-primary
                         transition-colors duration-150
                         p-2 -mr-2 rounded-md
                         focus-visible:outline-none
                         focus-visible:ring-2
                         focus-visible:ring-sage-primary"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isMenuOpen ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round" aria-hidden="true"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                  <span className="font-body text-sm font-medium">
                    Close
                  </span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round" aria-hidden="true"
                  >
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="font-body text-sm font-medium">
                    Menu
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ─── Mobile drop panel ─── */}
        {isMenuOpen && (
          <div
            id="mobile-menu"
            className="lg:hidden border-t border-sage-border
                       bg-sage-bg animate-fade-in"
            role="navigation"
            aria-label="Mobile navigation menu"
          >
            <div className="max-w-6xl mx-auto">
              {primaryNavLinks.map(({ label, href }) => (
                <Link
                  key={href}
                  to={href}
                  className={`
                    flex items-center min-h-[52px] px-5
                    font-body text-sm
                    border-b border-sage-border
                    transition-colors duration-150
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-inset
                    focus-visible:ring-sage-primary
                    ${isActive(href)
                      ? 'text-sage-primary font-medium bg-sage-surface-2'
                      : 'text-sage-text hover:bg-sage-surface-2'
                    }
                  `}
                >
                  {/* Active left border indicator */}
                  <span
                    className={`
                      w-[3px] h-[18px] rounded-full mr-4 flex-shrink-0
                      transition-colors
                      ${isActive(href) ? 'bg-sage-primary' : 'bg-transparent'}
                    `}
                    aria-hidden="true"
                  />
                  {label}
                </Link>
              ))}

              {/* ── Mobile Resources Accordion ── */}
              <div className="border-b border-sage-border">
                <button
                  type="button"
                  onClick={() => setIsResourcesMobileOpen((prev) => !prev)}
                  aria-expanded={isResourcesMobileOpen}
                  aria-controls="mobile-resources-accordion"
                  className={`
                    w-full flex items-center justify-between min-h-[52px] px-5
                    font-body text-sm text-left
                    transition-colors duration-150
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-primary
                    ${isResourcesActive
                      ? 'text-sage-primary font-medium bg-sage-surface-2'
                      : 'text-sage-text hover:bg-sage-surface-2'
                    }
                  `}
                >
                  <div className="flex items-center">
                    {/* Active left border indicator */}
                    <span
                      className={`
                        w-[3px] h-[18px] rounded-full mr-4 flex-shrink-0
                        transition-colors
                        ${isResourcesActive ? 'bg-sage-primary' : 'bg-transparent'}
                      `}
                      aria-hidden="true"
                    />
                    <span>Resources</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-sage-muted transition-transform duration-200 ${
                      isResourcesMobileOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {/* Sub-links */}
                {isResourcesMobileOpen && (
                  <div id="mobile-resources-accordion" className="bg-sage-surface-2/40 border-t border-sage-border/50">
                    {/* Blog link */}
                    <a
                      href="https://blog.joshuaomole.com"
                      className="flex flex-col justify-center min-h-[48px] pl-12 pr-5 py-2.5 border-b border-sage-border/40 hover:bg-sage-surface-2 transition-colors"
                    >
                      <div className="flex items-center gap-1 font-body text-sm font-medium text-sage-text">
                        <span>Blog</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-sage-muted" />
                      </div>
                      <span className="font-body text-xs text-sage-muted">
                        Articles on operations and systems
                      </span>
                    </a>

                    {/* Resources link */}
                    <Link
                      to="/resources"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex flex-col justify-center min-h-[48px] pl-12 pr-5 py-2.5 hover:bg-sage-surface-2 transition-colors"
                    >
                      <span className="font-body text-sm font-medium text-sage-text">
                        Resources
                      </span>
                      <span className="font-body text-xs text-sage-muted">
                        Free templates, guides and frameworks
                      </span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile CTA */}
              <div className="p-4">
                <Button
                  to="/audit"
                  variant="primary"
                  size="default"
                  className="w-full justify-center font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Book Audit
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navigation;
