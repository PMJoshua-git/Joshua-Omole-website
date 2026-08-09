import React, { useEffect, useState } from 'react';
import { ArrowRight, Mail, Network, ShieldCheck, Layers, BookOpen, MessageCircle } from 'lucide-react';
import FadeIn from '../components/FadeIn';
import Layout from '../components/Layout';
import QuoteBlock from '../components/QuoteBlock';
import NewsletterModal from '../components/NewsletterModal';
import { getAttributionData } from '../utils/attribution';

const Newsletter: React.FC = () => {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        document.title = "Newsletter | Joshua Omole";
    }, []);

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
        <Layout>
            <div className="min-h-screen bg-obsidian relative overflow-hidden">
                {/* Background Ambient Effects */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-full max-w-[800px] h-[600px] bg-blue/10 rounded-full blur-[150px] animate-[pulse_8s_infinite]"></div>
                    <div className="absolute bottom-[20%] right-[-10%] w-full max-w-[600px] h-[600px] bg-purple/10 rounded-full blur-[150px] animate-[pulse_10s_infinite_reverse]"></div>
                    
                    {/* Grid */}
                    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                </div>

                <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-24 relative z-10">
                    
                    {/* Hero Section */}
                    <FadeIn className="flex flex-col items-center text-center mb-20 relative">
                        {/* Floating elements */}
                        <Network className="absolute -top-12 left-10 md:left-20 w-8 h-8 text-blue/20 animate-[bounce_5s_infinite]" />
                        <Layers className="absolute top-10 right-10 md:right-32 w-10 h-10 text-purple/20 animate-[bounce_6s_infinite_1s]" />

                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue/10 border border-blue/30 text-blue font-mono text-sm mb-8 backdrop-blur-md">
                            <Mail className="w-4 h-4" />
                            <span>Weekly Dispatch</span>
                        </div>
                        
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white leading-tight tracking-tight mb-6">
                            Ideas worth understanding.<br/>
                            <span className="text-transparent bg-clip-text bg-neon-gradient">Systems worth building.</span>
                        </h1>
                        
                        <p className="text-lg md:text-xl text-silver leading-relaxed max-w-2xl mx-auto mb-12">
                            Join professionals, founders, and decision-makers receiving practical insights on AI, technology, systems thinking, project execution, and business transformation.
                            <br/><br/>
                            <span className="font-medium text-white/90 block">No hype. No fluff. Just useful ideas you can apply.</span>
                        </p>

                        <div className="w-full max-w-md mx-auto bg-midnight/60 p-6 md:p-8 rounded-[2rem] border border-navy shadow-glow backdrop-blur-xl relative overflow-hidden group hover:border-blue/30 transition-colors duration-500">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-blue/20 transition-all duration-500"></div>
                            
                            {isSubmitted ? (
                                <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
                                    <div className="w-16 h-16 bg-blue/20 text-blue rounded-full flex items-center justify-center mx-auto mb-4 border border-blue/40">
                                        <ShieldCheck className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-serif text-white mb-2">Subscription Confirmed</h3>
                                    <p className="text-silver">Check your inbox to get started.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-4">
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
                                        className="w-full bg-blue text-white font-medium px-5 py-4 rounded-xl hover:bg-[#4d8bbd] hover:-translate-y-1 transition-all duration-300 shadow-[0_0_15px_rgba(60,117,165,0.3)] hover:shadow-[0_0_25px_rgba(60,117,165,0.5)] disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
                                    >
                                        {isSubmitting ? 'Joining...' : 'Subscribe'} 
                                        {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                                    </button>
                                </form>
                            )}
                            <p className="text-sm text-silver/70 mt-6 text-center relative z-10">
                                Join readers learning how to navigate technology, AI, and business change with greater clarity.
                            </p>
                        </div>
                    </FadeIn>

                    {/* Trust Section: What You'll Receive */}
                    <FadeIn delay={200} className="mb-24">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">What You'll Receive</h2>
                            <div className="w-16 h-1 bg-gradient-to-r from-blue to-transparent mx-auto rounded-full"></div>
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
                                <div key={idx} className="bg-midnight/40 border border-navy/50 p-8 rounded-3xl hover:border-blue/30 hover:bg-midnight/70 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                    <div className="w-2 h-8 bg-blue rounded-r-lg absolute left-0 top-8 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <h3 className="text-xl font-serif text-white mb-3 group-hover:text-blue transition-colors">{item.title}</h3>
                                    <p className="text-silver/90 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </FadeIn>

                    {/* Subscriber Experience Section / What To Expect */}
                    <FadeIn delay={500} className="mb-24">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">What To Expect</h2>
                        </div>
                        
                        <div className="flex flex-col md:flex-row justify-center items-stretch gap-4 max-w-4xl mx-auto">
                            {[
                                "Practical insights",
                                "Actionable ideas",
                                "Curated resources",
                                "Thoughtful analysis",
                                "Occasional frameworks"
                            ].map((text, idx) => (
                                <div key={idx} className="flex-1 bg-midnight/30 border border-navy/30 rounded-2xl p-5 flex items-center justify-center text-center">
                                    <span className="text-sm font-medium text-white/90">{text}</span>
                                </div>
                            ))}
                        </div>
                        <div className="text-center mt-8">
                            <span className="inline-block px-4 py-2 bg-obsidian border border-white/5 rounded-full text-xs text-silver/60 font-mono tracking-wide uppercase">
                                No spam. Unsubscribe anytime.
                            </span>
                        </div>
                    </FadeIn>

                    {/* Recent Insights Preview Section (CMS Ready Structure) */}
                    <FadeIn delay={600} className="mb-24">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">Recent Insights</h2>
                            <p className="text-silver">Explore previous editions.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { title: "The Hidden Cost of Unstructured AI Adoption", summary: "Without a clear framework, throwing AI tools at a team often creates more administrative bloat than actual efficiency." },
                                { title: "Systems over Software", summary: "Why the best operations rely on solid business systems first, and software second. Understanding the difference." },
                                { title: "Executive AI Literacy", summary: "What non-technical leaders actually need to understand about artificial intelligence to make safe, strategic decisions." }
                            ].map((post, idx) => (
                                <button type="button" onClick={() => setIsModalOpen(true)} key={idx} className="group text-left block w-full h-full bg-obsidian border border-navy/50 p-8 rounded-3xl hover:bg-midnight hover:border-blue/40 transition-all duration-300 flex flex-col">
                                    <div className="text-xs text-blue mb-4 font-mono">Archive // Preview</div>
                                    <h3 className="text-xl font-serif text-white mb-4 group-hover:text-blue transition-colors line-clamp-2">{post.title}</h3>
                                    <p className="text-silver/80 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">{post.summary}</p>
                                    <div className="mt-auto flex items-center text-sm font-medium text-white group-hover:text-blue transition-colors">
                                        Read More <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </FadeIn>

                    {/* Final CTA */}
                    <FadeIn delay={700} id="join">
                        <div className="text-center p-10 md:p-16 rounded-[3rem] bg-gradient-to-br from-[#1a1966]/40 to-obsidian border border-blue/30 relative overflow-hidden shadow-glow-hover backdrop-blur-xl">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[500px] bg-blue/10 blur-[100px] rounded-full pointer-events-none"></div>
                            
                            <h2 className="relative z-10 text-3xl md:text-5xl font-serif text-white mb-6">Stay Ahead Without Chasing Every Trend.</h2>
                            <p className="relative z-10 text-silver mb-10 max-w-xl mx-auto text-lg">
                                Get practical insights that help you think more clearly, make better decisions, and implement technology more effectively.
                            </p>
                            
                            <form onSubmit={handleSubmit} className="relative z-10 max-w-md mx-auto flex flex-col gap-3">
                                {isSubmitted ? (
                                    <div className="bg-white/5 border border-blue/30 rounded-xl p-4 text-white">
                                        Subscription Confirmed. Look out for the next edition.
                                    </div>
                                ) : (
                                    <>
                                        <input 
                                            type="email" 
                                            placeholder="Enter your email address" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-obsidian border border-navy text-white px-6 py-4 rounded-xl focus:outline-none focus:border-blue focus:ring-1 focus:ring-blue transition-all"
                                            required
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="w-full bg-blue text-white font-medium px-6 py-4 rounded-xl hover:bg-[#4d8bbd] hover:-translate-y-1 transition-all duration-300 shadow-lg disabled:opacity-70 disabled:hover:translate-y-0"
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
    );
};

export default Newsletter;
