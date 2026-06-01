import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Network, 
  MessageCircle, 
  Mail, 
  GraduationCap, 
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
            <div className={`relative p-6 sm:p-8 rounded-[2rem] border transition-all duration-500 overflow-hidden ${
                isPrimary 
                ? 'bg-midnight/80 border-blue/40 shadow-glow hover:shadow-glow-hover hover:-translate-y-2' 
                : 'bg-midnight/40 border-navy/50 hover:border-blue/30 hover:bg-midnight/70 hover:-translate-y-1'
            }`}>
                <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                        isPrimary 
                        ? 'bg-blue/10 text-blue border border-blue/20 shadow-[0_0_15px_rgba(60,117,165,0.2)]' 
                        : 'bg-obsidian border border-navy/50 text-silver group-hover:text-blue group-hover:border-blue/30'
                    }`}>
                        <Icon className="w-7 h-7" />
                    </div>
                    
                    <div className="flex-1 text-left w-full">
                        <h3 className={`text-xl sm:text-2xl font-serif mb-2 ${isPrimary ? 'text-white' : 'text-white group-hover:text-white transition-colors'}`}>
                            {title}
                        </h3>
                        <p className={`text-sm sm:text-base leading-relaxed mb-4 ${isPrimary ? 'text-silver' : 'text-silver/90'}`}>
                            {description}
                        </p>
                        
                        <div className={`inline-flex items-center text-sm font-semibold transition-all ${
                            isPrimary 
                            ? 'text-white bg-blue/20 border border-blue/30 px-5 py-2.5 rounded-full hover:bg-blue/30' 
                            : 'text-blue group-hover:text-white'
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
    useEffect(() => {
        document.title = "Connect | Joshua Omole";
    }, []);

    return (
        <Layout>
            <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-24 relative">
                
                {/* Profile Hero Section */}
                <FadeIn className="flex flex-col items-center text-center mb-16">
                    <div className="relative w-32 h-32 md:w-40 md:h-40 mb-8 mx-auto group">
                        {/* Soft glow behind portrait */}
                        <div className="absolute inset-0 bg-blue/20 rounded-[2.5rem] blur-[20px] transition-all duration-700 group-hover:bg-blue/30"></div>
                        
                        <div className="relative w-full h-full bg-midnight rounded-[2rem] border border-navy shadow-lg overflow-hidden z-10 p-1">
                            <img 
                                src="/joshua-portrait.jpg" 
                                alt="Joshua Omole" 
                                className="w-full h-full object-cover rounded-[1.75rem]"
                            />
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-serif text-white leading-tight tracking-tight max-w-2xl mx-auto">
                        I help businesses design smarter operations
                        <span className="block text-xl md:text-2xl text-silver font-sans font-light mt-4 leading-relaxed">
                            using technical tools, AI, systems thinking and practical execution.
                        </span>
                    </h1>
                </FadeIn>

                {/* Primary CTA */}
                <FadeIn delay={100} className="mb-10">
                    <ConnectCard 
                        title="Free AI & Technology Audit"
                        description="Get practical insights into your operations, identify opportunities for improvement, and discover where AI and automation can create real business value."
                        buttonText="Get Started"
                        icon={Search}
                        to="/audit"
                        isPrimary={true}
                    />
                </FadeIn>

                {/* Further Steps */}
                <FadeIn delay={200} className="mb-8 text-center sm:text-left pl-2">
                    <h2 className="text-2xl font-serif text-white mb-2">Choose Your Next Step</h2>
                    <p className="text-silver text-sm max-w-sm mx-auto sm:mx-0">
                        Explore resources, training, community, and services designed to help you grow and work smarter.
                    </p>
                </FadeIn>

                <div className="space-y-4 mb-20">
                    <FadeIn delay={300}>
                        <ConnectCard 
                            title="Join My WhatsApp Channel"
                            description="Practical AI & technical insights, implementation ideas, business systems thinking, and lessons from the field."
                            buttonText="Join Channel"
                            icon={MessageCircle}
                            href="https://whatsapp.com/channel/0029VbDLFtOL7UVdGXm7aw1E"
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
                            title="AI & Technical Training"
                            description="Training programs for executives, teams, and individuals looking to build practical AI capability."
                            buttonText="Explore Training"
                            icon={GraduationCap}
                            to="/training"
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
                        <span className="text-[5rem] sm:text-[8rem] font-serif font-black text-white whitespace-nowrap -rotate-2">
                            ADAPTATION
                        </span>
                    </div>
                    <FadeIn className="relative z-10 w-full">
                        <QuoteBlock 
                            quote="Technology only creates value when people understand how to use it."
                        />
                    </FadeIn>
                </div>

                {/* Footer CTA specifically for Connect Page */}
                <FadeIn delay={200} className="mb-8">
                    <div className="p-8 md:p-12 text-center rounded-[3rem] bg-gradient-to-br from-midnight to-obsidian border border-navy relative overflow-hidden backdrop-blur-xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue/10 blur-[80px] rounded-full pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple/10 blur-[80px] rounded-full pointer-events-none"></div>
                        
                        <h2 className="relative z-10 text-2xl md:text-4xl font-serif text-white mb-4">Ready to Build Smarter Systems?</h2>
                        <p className="relative z-10 text-silver mb-8 max-w-lg mx-auto">
                            Whether you're exploring AI, improving operations, or building new capabilities, start with a conversation.
                        </p>
                        <div className="relative z-10">
                            <Button to="/contact" variant="primary" size="large" className="shadow-lg hover:shadow-glow-hover transition-all duration-300 hover:-translate-y-1">
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
