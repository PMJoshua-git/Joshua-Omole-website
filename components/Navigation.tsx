import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from './Button';

const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Scroll detection — triggers subtle bottom-border shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Define the nav links in a single array — single source of truth
  const navLinks = [
    { label: 'About',    href: '/about'         },
    { label: 'Services', href: '/services'       },
    { label: 'Insights',  href: '/knowledge-hub'  },
  ];

  // Helper: is this link the active page?
  const isActive = (href: string) =>
    location.pathname === href ||
    (href !== '/' && location.pathname.startsWith(href));

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
              {navLinks.map(({ label, href }) => (
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
              onClick={() => setIsMenuOpen(prev => !prev)}
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
              {navLinks.map(({ label, href }) => (
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
