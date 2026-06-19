import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ROUTES } from '../constants';
import Button from './Button';

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <nav className={`fixed w-full z-[70] pointer-events-none transition-all duration-300 ${scrolled ? 'py-4' : 'py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pointer-events-auto">
        <div className={`
            flex justify-between items-center px-6 py-4 rounded-full transition-all duration-300
            ${scrolled ? 'glass-panel shadow-glow' : 'bg-transparent border border-transparent'}
        `}>
          {/* Logo */}
          <Link to="/" className="flex flex-col group">
            <div className="flex items-center gap-2">
                {/* Logo Icon */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue to-purple flex items-center justify-center shadow-glow">
                    <span className="text-white font-serif italic font-bold text-xs">J.O</span>
                </div>
                <span className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight group-hover:text-blue transition-colors">Joshua Omole</span>
            </div>
            <span className="hidden md:block text-[10px] text-silver tracking-widest uppercase mt-0.5 font-medium pl-10">Business Operations & AI Systems Strategist</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-2 bg-midnight/40 rounded-full p-1.5 border border-navy/50 backdrop-blur-md">
            {ROUTES.filter(r => r.name !== 'Contact').map((route) => (
              <Link
                key={route.path}
                to={route.path}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  location.pathname === route.path 
                    ? 'bg-navy/50 text-white shadow-sm border border-navy' 
                    : 'text-silver hover:text-white hover:bg-white/5'
                }`}
              >
                {route.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center">
             <Button to="/contact" variant="primary" size="small" className="text-sm font-semibold">
                Book Strategy Call
              </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-blue focus:outline-none p-2 bg-white/5 rounded-full border border-navy"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-24 left-4 right-4 bg-midnight/95 backdrop-blur-xl border border-navy/50 shadow-2xl rounded-3xl animate-in slide-in-from-top-4 p-4 z-[70] max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain pointer-events-auto">
          <div className="flex flex-col space-y-2">
            {ROUTES.filter(r => r.name !== 'Contact').map((route) => (
              <Link
                key={route.path}
                to={route.path}
                className={`block px-5 py-4 rounded-2xl text-base font-medium text-center ${
                  location.pathname === route.path ? 'bg-navy/80 text-white border border-blue/30 shadow-glow' : 'text-silver hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {route.name}
              </Link>
            ))}
            <div className="pt-4 pb-2">
               <Button to="/contact" variant="primary" className="w-full justify-center" onClick={() => setIsOpen(false)}>
                Book Strategy Call
               </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;