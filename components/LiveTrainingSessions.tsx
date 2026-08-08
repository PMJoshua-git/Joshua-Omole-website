import React, { useEffect, useState } from 'react';
import FadeIn from './FadeIn';
import { TrainingSession } from '../types';
import { UsersRound, X } from 'lucide-react';
import Markdown from 'react-markdown';
import Cal, { getCalApi } from "@calcom/embed-react";
import { LiveTrainingSessionSkeleton } from './Skeleton';

const LiveTrainingSessions: React.FC = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showCalEmbed, setShowCalEmbed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', location: '', expectations: '' });
  
  useEffect(() => {
    if (!selectedSession) {
      setShowBookingForm(false);
      setShowCalEmbed(false);
      setFormData({ name: '', email: '', location: '', expectations: '' });
    }
  }, [selectedSession]);

  useEffect(() => {
    if (showCalEmbed) {
      (async function () {
        const cal = await getCalApi();
        cal("ui", {"styles":{"branding":{"brandColor":"#3c75a5"}},"hideEventTypeDetails":false,"layout":"month_view"});
      })();
    }
  }, [showCalEmbed]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/training-sessions');
        const result = await response.json();
        if (result.success) {
          setSessions(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch training sessions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedSession]);

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        location: formData.location,
        expectations: formData.expectations,
        sessionTitle: selectedSession.title
      };
      
      const response = await fetch('/api/book-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (result.success && selectedSession.calBookingLink) {
        setShowCalEmbed(true);
      } else {
        alert('Failed to submit booking. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section id="live-sessions" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-3xl mx-auto animate-pulse">
          <div className="shimmer h-8 w-40 bg-navy/20 rounded-full mx-auto mb-6"></div>
          <div className="shimmer h-12 w-5/6 bg-navy/20 rounded-xl mx-auto mb-6"></div>
          <div className="shimmer h-6 w-2/3 bg-navy/10 rounded-lg mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <LiveTrainingSessionSkeleton />
          <LiveTrainingSessionSkeleton />
          <LiveTrainingSessionSkeleton />
        </div>
      </section>
    );
  }

  if (sessions.length === 0) {
    return null; // Don't show section if no sessions published
  }

  return (
    <section id="live-sessions" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <FadeIn>
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue/10 border border-blue/30 text-blue font-mono text-sm mb-6">
            <span>Live & Interactive</span>
          </div>
          <h2 className="text-4xl font-serif text-white mb-6">Curated Sessions. Delivered Live. Built Around Your Business.</h2>
          <p className="text-silver text-lg">
            Pick a session, reserve your spot, and join a focused live training that combines technical knowledge, operational thinking, and real business application — with live Q&A built in.
          </p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sessions.map((session, idx) => (
          <FadeIn key={session.id} delay={idx * 100}>
            <div 
              onClick={() => setSelectedSession(session)}
              className="bg-midnight border border-navy rounded-[2.5rem] overflow-hidden group hover:-translate-y-2 hover:border-blue/50 hover:shadow-glow transition-all duration-500 cursor-pointer flex flex-col h-full"
            >
              {session.thumbnail && (
                <div className="w-full aspect-[16/9] overflow-hidden">
                  <img src={session.thumbnail} alt={session.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <div className="p-8 flex-grow flex flex-col">
                <h3 className="text-white font-serif text-xl mb-3">{session.title}</h3>
                <p className="text-silver text-sm line-clamp-3 mb-6 flex-grow">{session.shortDescription}</p>
                
                <div className="w-full h-px bg-white/5 mb-4 mt-auto"></div>
                
                {session.monthlyEnrollments > 0 && (
                  <div className="flex items-center text-xs text-gray-500">
                    <UsersRound className="w-3 h-3 mr-1.5" />
                    <span>{session.monthlyEnrollments} people enrolled in the last 30 days</span>
                  </div>
                )}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Modal Overlay */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={() => setSelectedSession(null)}>
          <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm"></div>
          
          <div 
            className="bg-midnight border border-navy rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl custom-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedSession(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 bg-obsidian/80 hover:bg-obsidian border border-white/10 rounded-full flex items-center justify-center text-silver hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedSession.thumbnail && (
              <div className="w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden relative">
                <img src={selectedSession.thumbnail} alt={selectedSession.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight to-transparent"></div>
              </div>
            )}

            <div className="p-8 md:p-12 -mt-12 relative z-10 bg-midnight rounded-t-[2.5rem]">
              <h2 className="text-3xl md:text-4xl font-serif text-white mb-3">{selectedSession.title}</h2>
              <div className="text-blue font-mono text-sm mb-8">{selectedSession.durationHours}-hour live session</div>

              {!showBookingForm && !showCalEmbed ? (
                <>
                  <div className="prose prose-invert prose-silver max-w-none mb-10">
                    <Markdown>{selectedSession.fullDescription}</Markdown>
                  </div>

                  {selectedSession.whatYouGet && (
                    <div className="bg-obsidian/50 border border-white/5 rounded-2xl p-6 md:p-8 mb-10">
                      <h4 className="text-white font-bold text-sm tracking-widest uppercase mb-6">What You Walk Away With:</h4>
                      <ul className="space-y-4">
                        {selectedSession.whatYouGet.split('|').map((item, i) => (
                          <li key={i} className="flex items-start text-silver">
                            <span className="text-purple mr-3 mt-1">•</span>
                            <span>{item.trim()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-navy/50">
                    <div>
                      <div className="text-white text-2xl font-serif mb-1">From ${selectedSession.priceTierA}</div>
                      <div className="text-gray-500 text-xs max-w-xs">Pricing varies by region. Your rate will be confirmed at booking.</div>
                    </div>
                    <button 
                      onClick={() => setShowBookingForm(true)}
                      className="w-full md:w-auto px-8 py-4 bg-blue hover:bg-blue/90 text-white font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(60,117,165,0.3)] hover:shadow-[0_0_30px_rgba(60,117,165,0.5)]"
                    >
                      Book Your Session &rarr;
                    </button>
                  </div>
                </>
              ) : showCalEmbed ? (
                <div className="w-full h-[600px] bg-white rounded-xl overflow-hidden mt-4">
                  <Cal
                    namespace="30min"
                    calLink={selectedSession.calBookingLink ? selectedSession.calBookingLink.replace(/^https?:\/\/(www\.)?cal\.com\//, '') : "joshua-omole-d9c2vi/30min"}
                    style={{ width: "100%", height: "100%", overflow: "scroll" }}
                    config={{ 
                      layout: "month_view",
                      name: formData.name.trim(),
                      email: formData.email
                    }}
                  />
                </div>
              ) : (
                <form onSubmit={handleBookSession} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm text-silver font-medium ml-1">Full Name *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-obsidian/60 border border-navy text-white px-5 py-4 rounded-xl focus:outline-none focus:border-blue transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-silver font-medium ml-1">Email Address *</label>
                      <input 
                        type="email" 
                        required
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-obsidian/60 border border-navy text-white px-5 py-4 rounded-xl focus:outline-none focus:border-blue transition-all"
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-silver font-medium ml-1">Location *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      className="w-full bg-obsidian/60 border border-navy text-white px-5 py-4 rounded-xl focus:outline-none focus:border-blue transition-all"
                      placeholder="City, Country"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-silver font-medium ml-1">What do you expect from this training?</label>
                    <textarea 
                      value={formData.expectations}
                      onChange={e => setFormData({...formData, expectations: e.target.value})}
                      className="w-full bg-obsidian/60 border border-navy text-white px-5 py-4 rounded-xl focus:outline-none focus:border-blue transition-all h-32 resize-none"
                      placeholder="Tell me what you hope to get out of this session..."
                    ></textarea>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6">
                    <button 
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="text-silver hover:text-white transition-colors"
                    >
                      &larr; Back to Details
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full md:w-auto px-8 py-4 bg-blue hover:bg-blue/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? 'Processing...' : 'Continue to Schedule'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default LiveTrainingSessions;
