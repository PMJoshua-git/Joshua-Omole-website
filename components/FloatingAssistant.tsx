import React, { useState, useEffect } from 'react';
import { X, Bot } from 'lucide-react';

const FloatingAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);

  // Teaser Logic
  useEffect(() => {
    // Initial popup delay (5 seconds)
    const initialTimer = setTimeout(() => {
      if (!isOpen) {
        setShowTeaser(true);
      }
    }, 5000);

    return () => {
      clearTimeout(initialTimer);
    };
  }, [isOpen]);

  // Load JotForm Handler Script when chat is opened to ensure iframe behaves correctly
  useEffect(() => {
    if (isOpen) {
        const scriptId = 'jotform-script-handler';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://cdn.jotfor.ms/s/umd/d828eae51f2/for-form-embed-handler.js';
            script.async = true;
            script.onload = () => {
                // Initialize handler once loaded
                if ((window as any).jotformEmbedHandler) {
                    (window as any).jotformEmbedHandler("iframe[id='JotFormIFrame-019b3f0fa49d753791c4f0020584579e405a']", "https://www.jotform.com");
                }
            };
            document.body.appendChild(script);
        } else {
             // If script already exists, just re-initialize handler for the new iframe instance
             if ((window as any).jotformEmbedHandler) {
                 // Small delay to ensure iframe is in DOM
                 setTimeout(() => {
                    (window as any).jotformEmbedHandler("iframe[id='JotFormIFrame-019b3f0fa49d753791c4f0020584579e405a']", "https://www.jotform.com");
                 }, 100);
            }
        }
    }
  }, [isOpen]);

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) {
        setShowTeaser(false);
    }
  };

  const handleDismissTeaser = () => {
    setShowTeaser(false);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        onClick={toggleOpen}
        className={`fixed bottom-6 right-6 z-[60] bg-sage-primary text-white hover:bg-sage-primary-hover rounded-full w-12 h-12 shadow-md transition-colors flex items-center justify-center ${isOpen ? 'rotate-90' : 'rotate-0'}`}
        aria-label={isOpen ? "Close Chat" : "Open Chat"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-7 h-7" />}
      </button>

      {/* Chat Window Container */}
      <div 
        className={`fixed bottom-24 right-4 md:right-6 z-[60] transition-all duration-300 transform origin-bottom-right ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-90 translate-y-8 pointer-events-none'
        }`}
      >
        <div className="bg-sage-surface border border-sage-border shadow-2xl rounded-2xl overflow-hidden w-[90vw] md:w-[400px] h-[600px] max-h-[75vh] relative flex flex-col">
            {/* Loading Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center bg-sage-surface -z-10">
                <div className="w-8 h-8 border-2 border-sage-primary border-t-transparent rounded-full animate-spin"></div>
            </div>

            {isOpen && (
                <iframe 
                    id="JotFormIFrame-019b3f0fa49d753791c4f0020584579e405a" 
                    title="Chatbot: Service Advisor"
                    allowtransparency="true"
                    allow="geolocation; microphone; camera; fullscreen"
                    src="https://agent.jotform.com/019b3f0fa49d753791c4f0020584579e405a?embedMode=iframe&background=1&shadow=1"
                    frameBorder="0"
                    style={{ minWidth: '100%', maxWidth: '100%', height: '100%', border: 'none' }}
                    scrolling="no"
                />
            )}
        </div>
      </div>

      {/* AI Teaser Popup - Positioned to point at the button */}
      <div 
        className={`fixed bottom-24 right-6 z-[59] flex flex-col items-end pointer-events-none transition-all duration-500 transform ${
          showTeaser && !isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="pointer-events-auto bg-sage-surface border border-sage-border p-4 rounded-2xl shadow-sm relative max-w-xs mb-2">
          <button 
            onClick={handleDismissTeaser}
            className="absolute top-2 right-2 text-sage-muted hover:text-sage-primary transition-colors p-1"
            aria-label="Dismiss assistant"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-4 pr-6">
            <div className="w-10 h-10 rounded-full bg-sage-primary flex items-center justify-center flex-shrink-0 shadow-sm">
               <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sage-text font-medium text-sm mb-1">Hi there!</p>
              <p className="text-sage-muted text-xs leading-relaxed mb-3">
                I'm Joshua's AI Assistant. Click the button below to chat!
              </p>
              <button 
                onClick={() => {
                    handleDismissTeaser();
                    setIsOpen(true);
                }}
                className="inline-flex items-center text-xs font-bold text-sage-primary hover:text-sage-primary-hover transition-colors"
              >
                Start Chat
              </button>
            </div>
          </div>
          
          {/* Decorative Arrow/Tail pointing down to toggle button */}
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-sage-surface border-b border-r border-sage-border transform rotate-45"></div>
        </div>
      </div>
    </>
  );
};

export default FloatingAssistant;