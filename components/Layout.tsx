import React from 'react';
import Navigation from './Navigation';
import { ChildrenProps } from '../types';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';
import { Linkedin, Facebook } from 'lucide-react';

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const MediumIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
  </svg>
);

const Layout: React.FC<ChildrenProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-obsidian text-white font-sans antialiased selection:bg-purple/30 selection:text-white">
      <Navigation />
      
      <main className="flex-grow pt-24 relative z-10">
        {children}
      </main>

      <footer className="bg-midnight/50 border-t border-navy mt-20 relative overflow-hidden backdrop-blur-lg">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-purple rounded-full blur-[128px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue rounded-full blur-[128px] opacity-10 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-serif font-bold text-white mb-4">Joshua Omole</h3>
              <p className="text-silver text-sm leading-relaxed max-w-sm mb-6">
                Helping founders and leadership teams integrate AI and technology into their operations using a proven Change management framework that does not disrupt operations.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                <a 
                  href="https://www.linkedin.com/in/joshuaolaaduraomole" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-silver hover:text-white hover:bg-blue hover:border-blue transition-all duration-300 shadow-sm hover:shadow-glow"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a 
                  href="https://facebook.com/joshua.omole" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-silver hover:text-white hover:bg-[#1877F2] hover:border-[#1877F2] transition-all duration-300 shadow-sm hover:shadow-glow"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a 
                  href="https://x.com/JO_JoshuaOmole" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-silver hover:text-white hover:bg-black hover:border-white/20 transition-all duration-300 shadow-sm hover:shadow-glow"
                  aria-label="X (Twitter)"
                >
                  <XIcon className="w-4 h-4" />
                </a>
                <a 
                  href="https://medium.com/@joshuaomole" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-silver hover:text-white hover:bg-black hover:border-white/20 transition-all duration-300 shadow-sm hover:shadow-glow"
                  aria-label="Medium"
                >
                  <MediumIcon className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Navigation</h4>
              <ul className="space-y-3">
                {ROUTES.map(route => (
                  <li key={route.path}>
                    <Link to={route.path} className="text-sm text-silver hover:text-white hover:shadow-glow transition-all hover:translate-x-1 inline-block">
                      {route.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact</h4>
              <p className="text-sm text-silver mb-4">Book a strategy call to discuss your integration needs.</p>
              <Link to="/contact" className="text-sm text-blue font-medium hover:text-purple transition-colors flex items-center group">
                Book a Strategy Call <span className="ml-1 transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-navy text-center md:text-left flex flex-col md:flex-row justify-between items-center text-xs text-silver/60">
            <p>&copy; {new Date().getFullYear()} Joshua Omole. All rights reserved.</p>
            <p className="mt-2 md:mt-0">AI Integration Specialist || IT Project Manager</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;