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

    // Periodic reminder interval (every 2 minutes)
    // This ensures the agent engages the user periodically as they scroll/read
    const intervalTimer = setInterval(() => {
      if (!isOpen) {
        setShowTeaser(true);
      }
    }, 120000); // 120,000 ms = 2 minutes

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
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
        // We do not set sessionStorage here anymore to allow the interval to show it again later
    }
  };

  const handleDismissTeaser = () => {
    setShowTeaser(false);
    // We do not set sessionStorage here anymore so it can pop up again
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        onClick={toggleOpen}
        className={`fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-blue to-purple text-white shadow-glow hover:shadow-glow-hover flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 ${isOpen ? 'rotate-90' : 'rotate-0'}`}
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
        <div className="bg-midnight border border-navy shadow-2xl rounded-2xl overflow-hidden w-[90vw] md:w-[400px] h-[600px] max-h-[75vh] relative flex flex-col">
            {/* Loading Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center bg-midnight -z-10">
                <div className="w-8 h-8 border-2 border-blue border-t-transparent rounded-full animate-spin"></div>
            </div>

            {isOpen && (
                <iframe 
                    id="JotFormIFrame-019b3f0fa49d753791c4f0020584579e405a" 
                    title="Chatbot: Service Advisor"
                    allowTransparency={true}
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
        <div className="pointer-events-auto bg-midnight border border-navy p-4 rounded-2xl shadow-glow relative glass-panel max-w-xs mb-2">
          <button 
            onClick={handleDismissTeaser}
            className="absolute top-2 right-2 text-silver hover:text-white transition-colors p-1"
            aria-label="Dismiss assistant"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-4 pr-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue to-purple flex items-center justify-center flex-shrink-0 shadow-lg border border-white/10">
               <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-medium text-sm mb-1">Hi there!</p>
              <p className="text-silver text-xs leading-relaxed mb-3">
                I'm Joshua's AI Assistant. Click the button below to chat!
              </p>
              <button 
                onClick={() => {
                    handleDismissTeaser();
                    setIsOpen(true);
                }}
                className="inline-flex items-center text-xs font-bold text-blue hover:text-purple transition-colors"
              >
                Start Chat
              </button>
            </div>
          </div>
          
          {/* Decorative Arrow/Tail pointing down to toggle button */}
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-midnight border-b border-r border-navy transform rotate-45"></div>
        </div>
      </div>
    </>
  );
};

export default FloatingAssistant;