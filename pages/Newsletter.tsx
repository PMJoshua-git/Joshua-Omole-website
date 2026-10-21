import React, { useEffect, useState } from 'react';
import { ArrowRight, Mail, Network, ShieldCheck, Layers, BookOpen, MessageCircle } from 'lucide-react';
import FadeIn from '../components/FadeIn';
import Layout from '../components/Layout';
import QuoteBlock from '../components/QuoteBlock';
import NewsletterModal from '../components/NewsletterModal';
import { getAttributionData } from '../utils/attribution';
import { Helmet } from 'react-helmet-async';

const Newsletter: React.FC = () => {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    firstName: firstName || '',
                    lastName: '',
                    userGroup: 'Newsletter Subscriber',
                    mailingLists: {},
                })
            });
            const result = await response.json();
            if (!response.ok) {
                console.error('Newsletter subscribe error:', result);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
            setIsSubmitted(true);
            setEmail('');
            setFirstName('');
        }
    };

    return (
        <>
            <Helmet>
                <title>Newsletter | Joshua Omole</title>
                <meta name="description" content="Join professionals, founders, and decision-makers receiving practical insights on AI, technology, systems thinking, project execution, and business transformation" />
                <meta property="og:title" content="Newsletter | Joshua Omole" />
                <meta property="og:description" content="Join professionals, founders, and decision-makers receiving practical insights on AI, technology, systems thinking, project execution, and business transformation" />
            </Helmet>
            <Layout>
            <div className="min-h-screen bg-sage-bg relative overflow-hidden">
                <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-24 relative z-10">
                    
                    {/* Hero Section */}
                    <FadeIn className="flex flex-col items-center text-center mb-20 relative">
                        {/* Floating elements */}
                        <Network className="absolute -top-12 left-10 md:left-20 w-8 h-8 text-sage-primary/20 animate-[bounce_5s_infinite]" />
                        <Layers className="absolute top-10 right-10 md:right-32 w-10 h-10 text-sage-primary/20 animate-[bounce_6s_infinite_1s]" />

                        <div className="text-sage-primary font-mono text-sm tracking-widest uppercase mb-8">
                            Weekly Dispatch
                        </div>
                        
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-sage-text leading-tight tracking-tight mb-6">
                            Ideas worth understanding.<br/>
                            <span className="text-sage-primary">Systems worth building.</span>
                        </h1>
                        
                        <p className="text-lg md:text-xl text-sage-muted leading-relaxed max-w-2xl mx-auto mb-12">
                            Join professionals, founders, and decision-makers receiving practical insights on AI, technology, systems thinking, project execution, and business transformation.
                            <br/><br/>
                            <span className="font-medium text-sage-text block">No hype. No fluff. Just useful ideas you can apply.</span>
                        </p>

                        <div className="w-full max-w-md mx-auto bg-sage-surface p-6 md:p-8 rounded-2xl border border-sage-border shadow-sm relative overflow-hidden group hover:border-sage-primary/30 transition-colors duration-500">
                            {isSubmitted ? (
                                <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
                                    <div className="w-16 h-16 bg-sage-primary/20 text-sage-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-sage-primary/30">
                                        <ShieldCheck className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-serif text-sage-text mb-2">Subscription Confirmed</h3>
                                    <p className="text-sage-muted">Check your inbox to get started.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-4">
                                    <h3 className="text-xl font-serif text-sage-text mb-2 text-left">Join the list</h3>
                                    <input 
                                        type="text" 
                                        placeholder="First Name" 
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full bg-sage-surface-2 border border-sage-border text-sage-text px-5 py-4 rounded-xl focus:outline-none focus:border-sage-primary focus:ring-1 focus:ring-sage-primary transition-all"
                                        required
                                    />
                                    <input 
                                        type="email" 
                                        placeholder="Email Address" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-sage-surface-2 border border-sage-border text-sage-text px-5 py-4 rounded-xl focus:outline-none focus:border-sage-primary focus:ring-1 focus:ring-sage-primary transition-all"
                                        required
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="w-full bg-sage-primary text-white font-medium px-5 py-4 rounded-xl hover:bg-sage-primary-hover hover:-translate-y-0.5 transition-all duration-300 shadow-sm disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
                                    >
                                        {isSubmitting ? 'Joining...' : 'Subscribe'} 
                                        {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                                    </button>
                                </form>
                            )}
                            <p className="text-sm text-sage-muted mt-6 text-center relative z-10">
                                Join readers learning how to navigate technology, AI, and business change with greater clarity.
                            </p>
                        </div>
                    </FadeIn>

                    {/* Trust Section: What You'll Receive */}
                    <FadeIn delay={200} className="mb-24">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-serif text-sage-text mb-4">What You'll Receive</h2>
                            <div className="w-16 h-1 bg-sage-primary mx-auto rounded-full"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { title: "AI & Technology Insights", desc: "Understand emerging technologies without getting lost in trends." },
                                { title: "Systems Thinking", desc: "Learn frameworks that help organisations work smarter." },
                                { title: "Project & Execution Lessons", desc: "Practical lessons from technology delivery and implementation." },
                                { title: "Business Applications", desc: "Real-world examples of how AI and technology create value." },
                                { title: "Tools & Frameworks", desc: "Useful resources that save time and improve decision-making." },
                                { title: "Observations & Ideas", desc: "Thoughtful perspectives on technology, work, and the future." },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-sage-surface border border-sage-border p-8 rounded-2xl hover:border-sage-primary/30 hover:bg-sage-surface-2 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
                                    <div className="w-1.5 h-8 bg-sage-primary rounded-r-lg absolute left-0 top-8 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <h3 className="text-xl font-serif text-sage-text mb-3 group-hover:text-sage-primary transition-colors">{item.title}</h3>
                                    <p className="text-sage-muted text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </FadeIn>

                    {/* Subscriber Experience Section / What To Expect */}
                    <FadeIn delay={500} className="mb-24">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-serif text-sage-text mb-4">What To Expect</h2>
                        </div>
                        
                        <div className="flex flex-col md:flex-row justify-center items-stretch gap-4 max-w-4xl mx-auto">
                            {[
                                "Practical insights",
                                "Actionable ideas",
                                "Curated resources",
                                "Thoughtful analysis",
                                "Occasional frameworks"
                            ].map((text, idx) => (
                                <div key={idx} className="flex-1 bg-sage-surface border border-sage-border rounded-2xl p-5 flex items-center justify-center text-center">
                                    <span className="text-sm font-medium text-sage-text">{text}</span>
                                </div>
                            ))}
                        </div>
                        <div className="text-center mt-8">
                            <span className="text-xs text-sage-muted font-mono tracking-wide uppercase">
                                No spam. Unsubscribe anytime.
                            </span>
                        </div>
                    </FadeIn>

                    {/* Recent Insights Preview Section (CMS Ready Structure) */}
                    <FadeIn delay={600} className="mb-24">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-serif text-sage-text mb-4">Recent Insights</h2>
                            <p className="text-sage-muted">Explore previous editions.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { title: "The Hidden Cost of Unstructured AI Adoption", summary: "Without a clear framework, throwing AI tools at a team often creates more administrative bloat than actual efficiency." },
                                { title: "Systems over Software", summary: "Why the best operations rely on solid business systems first, and software second. Understanding the difference." },
                                { title: "Executive AI Literacy", summary: "What non-technical leaders actually need to understand about artificial intelligence to make safe, strategic decisions." }
                            ].map((post, idx) => (
                                <button type="button" onClick={() => setIsModalOpen(true)} key={idx} className="group text-left block w-full h-full bg-sage-surface border border-sage-border p-8 rounded-2xl hover:bg-sage-surface-2 hover:border-sage-primary/30 transition-all duration-300 flex flex-col">
                                    <div className="text-xs text-sage-primary mb-4 font-mono">Archive // Preview</div>
                                    <h3 className="text-xl font-serif text-sage-text mb-4 group-hover:text-sage-primary transition-colors line-clamp-2">{post.title}</h3>
                                    <p className="text-sage-muted text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">{post.summary}</p>
                                    <div className="mt-auto flex items-center text-sm font-medium text-sage-text group-hover:text-sage-primary transition-colors">
                                        Read More <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </FadeIn>

                    {/* Final CTA */}
                    <FadeIn delay={700} id="join">
                        <div className="text-center p-10 md:p-16 rounded-2xl bg-sage-surface border border-sage-border relative overflow-hidden shadow-sm">
                            <h2 className="relative z-10 text-3xl md:text-5xl font-serif text-sage-text mb-6">Stay Ahead Without Chasing Every Trend.</h2>
                            <p className="relative z-10 text-sage-muted mb-10 max-w-xl mx-auto text-lg">
                                Get practical insights that help you think more clearly, make better decisions, and implement technology more effectively.
                            </p>
                            
                            <form onSubmit={handleSubmit} className="relative z-10 max-w-md mx-auto flex flex-col gap-3">
                                {isSubmitted ? (
                                    <div className="bg-sage-surface-2 border border-sage-border rounded-xl p-4 text-sage-text">
                                        Subscription Confirmed. Look out for the next edition.
                                    </div>
                                ) : (
                                    <>
                                        <input 
                                            type="email" 
                                            placeholder="Enter your email address" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-sage-surface-2 border border-sage-border text-sage-text px-6 py-4 rounded-xl focus:outline-none focus:border-sage-primary focus:ring-1 focus:ring-sage-primary transition-all"
                                            required
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="w-full bg-sage-primary text-white font-medium px-6 py-4 rounded-xl hover:bg-sage-primary-hover hover:-translate-y-0.5 transition-all duration-300 shadow-sm disabled:opacity-70 disabled:hover:translate-y-0"
                                        >
                                            {isSubmitting ? 'Joining...' : 'Subscribe'}
                                        </button>
                                    </>
                                )}
                            </form>
                        </div>
                    </FadeIn>

                </div>

                <NewsletterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            </div>
        </Layout>
    </>
  );
};

export default Newsletter;
