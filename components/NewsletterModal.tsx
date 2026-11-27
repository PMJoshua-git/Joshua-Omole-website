import React, { useState } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAttributionData } from '../utils/attribution';

interface NewsletterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NewsletterModal: React.FC<NewsletterModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const attribution = getAttributionData();
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    firstName: firstName.trim(),
                    lastName: '',
                    userGroup: 'Newsletter Subscriber',
                    source: 'Newsletter modal',
                    leadSource: attribution.lead_source || 'direct',
                    leadType: 'Newsletter Subscriber',
                    leadStatus: 'New',
                    landingPage: attribution.landing_page || window.location.pathname || '/',
                    utmSource: attribution.utm_source || '',
                    utmMedium: attribution.utm_medium || '',
                    utmCampaign: attribution.utm_campaign || '',
                    referrer: attribution.referrer || '',
                    mailingLists: {},
                })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || result?.success === false) {
                console.error('Newsletter subscribe error:', response.status);
                setSubmitError(result?.error || 'Unable to subscribe right now. Please try again.');
                return;
            }
            setIsSubmitted(true);
            setEmail('');
            setFirstName('');
            localStorage.setItem('newsletter_subscribed', 'true');
        } catch (err) {
            console.error(err);
            setSubmitError('Unable to reach our server right now. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 bg-sage-bg/80 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />
            {/* Modal Dialog */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 4 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-md bg-sage-surface p-8 rounded-2xl border border-sage-border shadow-lg overflow-hidden"
            >
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-sage-muted hover:text-sage-primary p-2 z-20 transition-colors">✕</button>
                
                {isSubmitted ? (
                    <div className="text-center py-6 animate-in fade-in zoom-in duration-500 relative z-10">
                        <div className="w-16 h-16 bg-sage-primary/20 text-sage-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-sage-primary/30">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-serif text-sage-text mb-2">Subscription Confirmed</h3>
                        <p className="text-sage-muted">Check your inbox to get started.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-4 mt-4">
                        <h3 className="text-xl font-serif text-sage-text mb-2 text-left">Join the list</h3>
                        <input 
                            type="text" 
                            placeholder="First Name" 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="input-interaction w-full bg-sage-surface-2 border border-sage-border text-sage-text px-5 py-4 rounded-xl"
                            required
                        />
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-interaction w-full bg-sage-surface-2 border border-sage-border text-sage-text px-5 py-4 rounded-xl"
                            required
                        />
                        {submitError && (
                            <p className="text-sm text-red-500 text-left">{submitError}</p>
                        )}
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full bg-sage-primary text-white font-medium px-5 py-4 rounded-xl hover:bg-sage-primary-hover hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-200 ease-out shadow-sm disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-2 mt-2 cursor-pointer"
                        >
                            {isSubmitting ? 'Joining...' : 'Subscribe'} 
                            {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                        </button>
                        <p className="text-sm text-sage-muted mt-4 text-center">
                            Join readers learning how to navigate technology, AI, and business change with greater clarity.
                        </p>
                        <p className="text-xs text-sage-muted/70 mt-2 text-center">
                            No spam. Unsubscribe anytime.
                        </p>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

export default NewsletterModal;
