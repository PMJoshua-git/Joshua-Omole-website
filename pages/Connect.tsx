import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, 
  Mail, 
  Briefcase, 
  BookOpen,
  Search,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import FadeIn from '../components/FadeIn';
import Layout from '../components/Layout';
import QuoteBlock from '../components/QuoteBlock';
import Button from '../components/Button';

interface ConnectCardProps {
    title: string;
    description: string;
    buttonText: string;
    icon: React.ElementType;
    to?: string;
    href?: string;
    isPrimary?: boolean;
}

const ConnectCard: React.FC<ConnectCardProps> = ({ title, description, buttonText, icon: Icon, to, href, isPrimary = false }) => {
    const isExternal = !!href;
    const Component = isExternal ? 'a' : (Link as any);
    const linkProps = isExternal ? { href, target: "_blank", rel: "noopener noreferrer" } : { to };
    
    return (
        <Component {...linkProps} className="block group w-full">
            <div className={`relative p-6 sm:p-8 rounded-xl border transition-all duration-300 overflow-hidden ${
                isPrimary 
                ? 'bg-sage-primary border-sage-primary shadow-sm hover:-translate-y-1 text-white' 
                : 'bg-sage-surface border-sage-border hover:border-sage-primary/40 hover:bg-sage-surface-2 hover:-translate-y-1 text-sage-text'
            }`}>
                <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    <div className={`shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                        isPrimary 
                        ? 'bg-white/20 text-white border border-white/20 shadow-sm' 
                        : 'bg-sage-bg border border-sage-border text-sage-primary group-hover:bg-sage-surface'
                    }`}>
                        <Icon className="w-7 h-7" />
                    </div>
                    
                    <div className="flex-1 text-left w-full">
                        <h3 className={`text-xl sm:text-2xl font-serif mb-2 ${isPrimary ? 'text-white' : 'text-sage-text'}`}>
                            {title}
                        </h3>
                        <p className={`text-sm sm:text-base leading-relaxed mb-4 ${isPrimary ? 'text-white/80' : 'text-sage-muted'}`}>
                            {description}
                        </p>
                        
                        <div className={`inline-flex items-center text-sm font-semibold transition-all ${
                            isPrimary 
                            ? 'text-white bg-white/20 border border-white/30 px-5 py-2.5 rounded-md hover:bg-white/30' 
                            : 'text-sage-primary hover:text-sage-primary-hover'
                        }`}>
                            {buttonText} {isPrimary ? <ArrowUpRight className="w-4 h-4 ml-2" /> : <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />}
                        </div>
                    </div>
                </div>
            </div>
        </Component>
    );
};

const Connect: React.FC = () => {
    const [imageIndex, setImageIndex] = useState(0);
    const imageSources = [
        "/images/joshua-portrait.jpg",
        "/images/joshua-portrait.JPG",
        "/joshua-portrait.jpg",
        "/joshua-portrait.JPG",
    ];

    const handleImageError = () => {
        if (imageIndex < imageSources.length - 1) {
            setImageIndex(imageIndex + 1);
        } else {
            setImageIndex(-1); // Show fallback UI
        }
    };

    useEffect(() => {
        document.title = "Connect | Joshua Omole";
    }, []);

    return (
        <Layout>
            <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-24 relative">
                
                {/* Profile Hero Section */}
                <FadeIn className="flex flex-col items-center text-center mb-16">
                    <div className="relative w-32 h-32 md:w-40 md:h-40 mb-8 mx-auto group">
                        <div className="relative w-full h-full bg-sage-surface rounded-xl border border-sage-border shadow-sm overflow-hidden z-10 p-1 flex items-center justify-center">
                            {imageIndex !== -1 ? (
                                <img 
                                    src={imageSources[imageIndex]} 
                                    alt="Joshua Omole — Business Operations and AI Systems Strategist" 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover rounded-xl"
                                    onError={handleImageError}
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-sage-primary to-sage-primary-hover rounded-xl flex items-center justify-center shadow-sm">
                                    <span className="text-white font-serif italic font-bold text-4xl">J.O</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-serif text-sage-text leading-tight tracking-tight max-w-2xl mx-auto">
                        I help businesses design smarter operations
                        <span className="block text-xl md:text-2xl text-sage-muted font-sans font-light mt-4 leading-relaxed">
                            using technical tools, AI, systems thinking and practical execution.
                        </span>
                    </h1>
                </FadeIn>

                {/* Further Steps */}
                <FadeIn delay={200} className="mb-8 text-center sm:text-left pl-2">
                    <h2 className="text-2xl font-serif text-sage-text mb-2">Choose Your Next Step</h2>
                    <p className="text-sage-muted text-sm max-w-sm mx-auto sm:mx-0">
                        Explore resources, training, community, and services designed to help you grow and work smarter.
                    </p>
                </FadeIn>

                <div className="space-y-4 mb-20">
                    <FadeIn delay={300}>
                        <ConnectCard 
                            title="Free AI & Technology Audit"
                            description="Get practical insights into your operations, identify opportunities for improvement, and discover where AI and automation can create real business value."
                            buttonText="Get Started"
                            icon={Search}
                            to="/audit"
                            isPrimary={true}
                        />
                    </FadeIn>

                    <FadeIn delay={400}>
                        <ConnectCard 
                            title="Subscribe to the Newsletter"
                            description="Receive thoughtful breakdowns on AI adoption, automation, project management, technology strategy, and business systems."
                            buttonText="Subscribe"
                            icon={Mail}
                            to="/newsletter"
                        />
                    </FadeIn>

                    <FadeIn delay={500}>
                        <ConnectCard 
                            title="Join My WhatsApp Channel"
                            description="Practical AI & technical insights, implementation ideas, business systems thinking, and lessons from the field."
                            buttonText="Join Channel"
                            icon={MessageCircle}
                            href="https://whatsapp.com/channel/0029VbDLFtOL7UVdGXm7aw1E"
                        />
                    </FadeIn>

                    <FadeIn delay={600}>
                        <ConnectCard 
                            title="Work With Me"
                            description="AI integration, technology strategy, automation design, and project oversight services."
                            buttonText="View Services"
                            icon={Briefcase}
                            to="/services"
                        />
                    </FadeIn>

                    <FadeIn delay={700}>
                        <ConnectCard 
                            title="Knowledge Hub"
                            description="Guides, frameworks, insights, tools, and practical resources to help you navigate technology and AI."
                            buttonText="Browse Resources"
                            icon={BookOpen}
                            to="/about"
                        />
                    </FadeIn>
                </div>

                {/* Large Background Quote */}
                <div className="relative py-32 mb-16 overflow-hidden flex items-center justify-center -mx-4 sm:-mx-6">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                        <span className="text-[5rem] sm:text-[8rem] font-serif font-black text-sage-primary whitespace-nowrap -rotate-2">
                            ADAPTATION
                        </span>
                    </div>
                    <FadeIn className="relative z-10 w-full">
                        <QuoteBlock 
                            quote="A business that runs on systems scales. A business that runs on people burns out."
                        />
                    </FadeIn>
                </div>

                {/* Footer CTA specifically for Connect Page */}
                <FadeIn delay={200} className="mb-8">
                    <div className="p-8 md:p-12 text-center rounded-xl bg-sage-primary border border-sage-border relative overflow-hidden text-white shadow-sm">
                        <h2 className="relative z-10 text-2xl md:text-4xl font-serif text-white mb-4">Ready to Build Smarter Systems?</h2>
                        <p className="relative z-10 text-sage-bg mb-8 max-w-lg mx-auto">
                            Whether you're exploring AI, improving operations, or building new capabilities, start with a conversation.
                        </p>
                        <div className="relative z-10">
                            <Button to="/audit" size="large" className="bg-sage-accent text-white hover:bg-sage-accent-hover shadow-sm hover:-translate-y-0.5 transition-all">
                                Book a Strategy Call
                            </Button>
                        </div>
                    </div>
                </FadeIn>

            </div>
        </Layout>
    );
};

export default Connect;
