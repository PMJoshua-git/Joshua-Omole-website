import React, { useState } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
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

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const attribution = getAttributionData();
        const payload = {
            firstName,
            email,
            ...attribution
        };

        try {
            const response = await fetch('/api/newsletter-subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!result.success) {
                console.error('Newsletter subscribe error', result);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
            setIsSubmitted(true);
            setEmail('');
            setFirstName('');
            localStorage.setItem('newsletter_subscribed', 'true');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md bg-midnight p-8 rounded-[2rem] border border-blue/30 shadow-glow overflow-hidden">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-silver hover:text-white p-2 z-20 transition-colors">✕</button>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                
                {isSubmitted ? (
                    <div className="text-center py-6 animate-in fade-in zoom-in duration-500 relative z-10">
                        <div className="w-16 h-16 bg-blue/20 text-blue rounded-full flex items-center justify-center mx-auto mb-4 border border-blue/40">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-serif text-white mb-2">Subscription Confirmed</h3>
                        <p className="text-silver">Check your inbox to get started.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-4 mt-4">
                        <h3 className="text-xl font-serif text-white mb-2 text-left">Join the list</h3>
                        <input 
                            type="text" 
                            placeholder="First Name" 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full bg-obsidian/80 border border-navy text-white px-5 py-4 rounded-xl focus:outline-none focus:border-blue focus:ring-1 focus:ring-blue transition-all"
                            required
                        />
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-obsidian/80 border border-navy text-white px-5 py-4 rounded-xl focus:outline-none focus:border-blue focus:ring-1 focus:ring-blue transition-all"
                            required
                        />
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full bg-blue text-white font-medium px-5 py-4 rounded-xl hover:bg-[#4d8bbd] hover:-translate-y-1 transition-all duration-300 shadow-md disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-2 mt-2"
                        >
                            {isSubmitting ? 'Joining...' : 'Subscribe'} 
                            {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                        </button>
                        <p className="text-sm text-silver/70 mt-4 text-center">
                            Join readers learning how to navigate technology, AI, and business change with greater clarity.
                        </p>
                        <p className="text-xs text-silver/50 mt-2 text-center">
                            No spam. Unsubscribe anytime.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
};

export default NewsletterModal;
