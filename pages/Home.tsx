import React, { useState } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import QuoteBlock from '../components/QuoteBlock';
import ServiceCard from '../components/ServiceCard';
import ProcessStep from '../components/ProcessStep';
import FadeIn from '../components/FadeIn';
import { Helmet } from 'react-helmet-async';
import { LayoutTemplate, ShieldCheck, Users, BrainCircuit, ArrowUpRight, PlayCircle, Code2, Cpu } from 'lucide-react';

const Home: React.FC = () => {
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

  return (
    <>
      <Helmet>
        <title>Joshua Omole | Business Operations and AI Systems Strategist</title>
        <meta name="description" content="Joshua Omole helps small and mid-sized businesses design smarter operations using AI, automation, and systems thinking. The bridge between business strategy and technical execution." />
        <meta property="og:title" content="Joshua Omole | Business Operations and AI Systems Strategist" />
        <meta property="og:description" content="Helping growing businesses design smarter operations using AI, automation, and systems thinking. Start with a free Systems Clarity Audit." />
        <meta property="og:url" content="https://joshuaomole.com" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://joshuaomole.com/images/joshua-portrait.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Joshua Omole | Business Operations and AI Systems Strategist" />
        <meta name="twitter:description" content="Helping growing businesses design smarter operations using AI, automation, and systems thinking." />
        <link rel="canonical" href="https://joshuaomole.com" />
      </Helmet>
      <Layout>
      {/* Section 1: Hero */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-32 pb-20 md:pt-48 md:pb-32 max-w-7xl mx-auto overflow-hidden">
        {/* Glow Backgrounds */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue rounded-full blur-[150px] opacity-20 -z-10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/4 -translate-y-1/3 w-[500px] h-[500px] bg-purple rounded-full blur-[150px] opacity-20 -z-10"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Content */}
          <div className="lg:col-span-6 relative z-10">
            <FadeIn direction="up">
              <div className="font-mono text-blue mb-6 tracking-wider text-sm border border-blue/30 inline-block px-3 py-1 rounded-full bg-blue/5">
                 {`{ Every operational problem has a fixable system behind it }`}
              </div>
              <h1 className="text-5xl md:text-7xl font-serif text-white leading-[1.05] mb-8 tracking-tight drop-shadow-xl">
                Your Business Is Growing. <br/> <span className="text-transparent bg-clip-text bg-neon-gradient">Your Operations Need to Keep Up.</span>
              </h1>
              <p className="text-xl text-silver leading-relaxed mb-10 max-w-lg">
                I help businesses design smarter operations using technical tools, AI, systems thinking and practical execution.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Button to="/contact" variant="primary" size="large" className="group">
                  Book a Free Audit <ArrowUpRight className="ml-2 w-5 h-5 group-hover:rotate-45 transition-transform" />
                </Button>
                <Button to="/services" variant="text" size="large" className="group text-silver hover:text-white">
                  See How I Work
                </Button>
              </div>
            </FadeIn>
          </div>
          
          {/* Right Visual Content */}
          <div className="lg:col-span-6 relative h-[500px] lg:h-[600px] flex items-center justify-center">
             <FadeIn direction="right" delay={200} className="w-full h-full relative">
                 {/* Main Image */}
                 <div className="absolute inset-0 z-0 rounded-[3rem] overflow-hidden border border-navy/50 shadow-glow bg-midnight flex items-center justify-center">
                    {imageIndex !== -1 ? (
                       <img 
                           src={imageSources[imageIndex]} 
                           alt="Joshua Omole — Business Operations and AI Systems Strategist" 
                           referrerPolicy="no-referrer"
                           className="w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-700"
                           onError={handleImageError}
                       />
                    ) : (
                       <div className="w-full h-full bg-gradient-to-br from-midnight via-navy/40 to-purple/20 flex flex-col items-center justify-center p-8 text-center">
                          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue to-purple flex items-center justify-center shadow-glow mb-6">
                             <span className="text-white font-serif italic font-bold text-3xl">J.O</span>
                          </div>
                          <h3 className="text-xl font-serif font-bold text-white mb-2">Joshua Omole</h3>
                          <p className="text-xs text-silver uppercase tracking-widest max-w-xs leading-relaxed">
                             Business Operations & AI Systems Strategist
                          </p>
                       </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent pointer-events-none"></div>
                 </div>
                 
                 {/* Floating Glass Card 1 - Code Snippet */}
                 <div className="absolute md:top-10 -bottom-6 md:bottom-auto -left-4 md:-left-12 glass-panel p-4 rounded-2xl w-56 md:w-64 scale-90 md:scale-100 origin-bottom-left animate-[float_6s_ease-in-out_infinite] shadow-lg border border-purple/30 z-20">
                    <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                        <Code2 className="w-4 h-4 text-purple" />
                        <span className="text-xs text-silver font-mono">system_optimization.py</span>
                    </div>
                    <div className="space-y-1.5 font-mono text-[10px] md:text-xs text-silver/80">
                        <div className="flex"><span className="text-blue mr-2">def</span> optimize_workflow():</div>
                        <div className="pl-4"><span className="text-purple">return</span> efficiency * 1.4</div>
                        <div className="pl-4 text-gray-500"># System Integrated</div>
                    </div>
                 </div>

                 {/* Floating Glass Card 2 - Stats */}
                 <div className="absolute bottom-24 md:bottom-20 -right-4 md:-right-8 glass-panel p-4 md:p-5 rounded-3xl w-48 md:w-60 scale-90 md:scale-100 origin-bottom-right animate-[float_5s_ease-in-out_infinite_reverse] shadow-lg border border-blue/30 z-20">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs text-silver uppercase tracking-wider">Processing</p>
                            <h4 className="text-2xl font-bold text-white">99.8%</h4>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue/20 flex items-center justify-center text-blue">
                            <Cpu className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-navy rounded-full overflow-hidden">
                        <div className="h-full bg-neon-gradient w-[99.8%] shadow-[0_0_10px_#3c75a5]"></div>
                    </div>
                 </div>

                 {/* Center Glow Flare - Simulating the touch point */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue rounded-full blur-[80px] opacity-60 mix-blend-screen animate-pulse"></div>
             </FadeIn>
          </div>
        </div>
      </section>

      {/* Section 2: Signature Quote */}
      <section className="px-4">
        <QuoteBlock 
          quote="I understand business. I understand the technology. My job is to make sure both work together in ways your team can actually use."
        />
      </section>

      {/* Section 3: Bento Grid Credibility */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <FadeIn>
            <h2 className="text-3xl font-serif mb-12 text-center text-white">What I Bring</h2>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Main large card */}
            <FadeIn className="md:col-span-2 lg:col-span-1 h-full">
                <div className="h-full bg-gradient-to-br from-navy to-midnight border border-navy text-white p-10 rounded-[2.5rem] flex flex-col justify-between relative overflow-hidden group hover:border-blue/50 transition-colors shadow-glow">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple/20 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-purple/30"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-white border border-white/10">
                            <BrainCircuit className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-serif mb-4 text-white">Systems First</h3>
                        <p className="text-silver leading-relaxed">I don't recommend a single tool until I understand the business. Every engagement starts with a clear map of how your operation actually runs and where it's breaking down.</p>
                    </div>
                </div>
            </FadeIn>
            
            <FadeIn delay={100} className="h-full">
                 <div className="h-full bg-midnight/50 p-10 rounded-[2.5rem] hover:bg-navy/50 transition-all duration-300 border border-navy hover:border-blue/50 group">
                    <div className="w-12 h-12 bg-blue/10 rounded-2xl flex items-center justify-center mb-6 text-blue group-hover:text-white group-hover:bg-blue transition-colors">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-serif mb-3 text-white">ROI Driven</h3>
                    <p className="text-silver text-sm leading-relaxed">If it doesn't save time, reduce cost, or grow revenue, it doesn't make the cut. Every recommendation is filtered through what actually moves the business forward.</p>
                 </div>
            </FadeIn>

            <FadeIn delay={200} className="h-full">
                 <div className="h-full bg-midnight/50 p-10 rounded-[2.5rem] hover:bg-navy/50 transition-all duration-300 border border-navy hover:border-purple/50 group">
                    <div className="w-12 h-12 bg-purple/10 rounded-2xl flex items-center justify-center mb-6 text-purple group-hover:text-white group-hover:bg-purple transition-colors">
                        <LayoutTemplate className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-serif mb-3 text-white">Technical Fluency</h3>
                    <p className="text-silver text-sm leading-relaxed">I speak the language of your developers, your vendors, and your tools. You get one person who bridges both sides without losing anything in translation.</p>
                 </div>
            </FadeIn>
            
            {/* Wide bottom card */}
            <FadeIn delay={300} className="md:col-span-2 lg:col-span-3">
                <div className="bg-midnight/50 p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 border border-navy hover:border-white/20 hover:shadow-glow transition-all">
                    <div className="w-16 h-16 bg-neon-gradient text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-glow">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-serif mb-2 text-white">Strategy to Execution</h3>
                        <p className="text-silver max-w-2xl">Strategy without execution is just a document. I use IT Project Management discipline — from designing the system to managing the implementation to measuring what actually changed.</p>
                    </div>
                    <div className="ml-auto">
                        <Button to="/about" variant="text">About Me <ArrowUpRight className="w-4 h-4 ml-1" /></Button>
                    </div>
                </div>
            </FadeIn>
        </div>
      </section>

      {/* Section 5: Services Overview */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20">
            <FadeIn>
                <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">How I Work With You</h2>
                <p className="text-silver max-w-2xl mx-auto text-lg">Three clear engagements. One consistent outcome — an operation that runs better than it did before.</p>
            </FadeIn>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <FadeIn delay={0} className="h-full">
                <ServiceCard 
                    title="Systems Clarity Audit"
                    description="A focused 30-minute diagnostic session where we look at how your business currently runs, identify the highest-leverage pressure points, and give you immediate, actionable steps."
                    outcomes={[
                        "Identify high-pressure points",
                        "Map current workflows",
                        "Surface immediate quick wins",
                        "Assess operational health"
                    ]}
                    ctaText="Start Here"
                    ctaLink="/audit"
                    isPrimary={true}
                />
            </FadeIn>
            <FadeIn delay={150} className="h-full">
                <ServiceCard 
                    title="Operational Diagnostic Brief"
                    description="A structured deep-dive into your operations. We map how work actually moves and deliver a detailed Brief showing what's broken, what it costs, and the exact roadmap to fix it."
                    outcomes={[
                        "Current bottleneck analysis",
                        "Cost & ROI breakdown",
                        "Tool & resource requirements",
                        "Implementation roadmap"
                    ]}
                    ctaText="See the Brief"
                    ctaLink="/services"
                />
            </FadeIn>
            <FadeIn delay={300} className="h-full">
                 <ServiceCard 
                    title="Implementation Partnership"
                    description="We lead the execution of the Brief's recommendations — coordinating specialists, managing the project, and overseeing the transition from your current state to the future state."
                    outcomes={[
                        "Full execution management",
                        "Vendor coordination",
                        "Internal workflow transition",
                        "Outcome validation"
                    ]}
                    ctaText="Discuss Implementation"
                    ctaLink="/contact"
                />
            </FadeIn>
        </div>
      </section>

      {/* Section 6: How Work Gets Done */}
      <section className="py-24 bg-midnight/30 rounded-[3rem] mx-4 mb-20 border border-navy/50">
        <div className="max-w-4xl mx-auto px-6">
            <FadeIn>
                <h2 className="text-3xl md:text-4xl font-serif text-white mb-16 text-center">The Integration Process</h2>
            </FadeIn>
            <div className="space-y-6">
                <ProcessStep 
                    number="01" 
                    title="Understand the Business First" 
                    description="I audit your current operations, goals, and bottlenecks before touching a single tool. The problem has to be clear before the solution can be designed." 
                    delay={0}
                />
                <ProcessStep 
                    number="02" 
                    title="Find the Real Opportunities" 
                    description="I filter the hype to identify specifically where AI and automation create measurable value for your business — not AI in general. Yours." 
                    delay={100}
                />
                <ProcessStep 
                    number="03" 
                    title="Design the System" 
                    description="I map the future state — how data flows, how teams interact with the tools, what the operation looks like when it works the way it should." 
                    delay={200}
                />
                 <ProcessStep 
                    number="04" 
                    title="Manage the Execution" 
                    description="I coordinate the implementation, ensuring every technical decision serves the operational goal — not the other way around." 
                    delay={300}
                />
                 <ProcessStep 
                    number="05" 
                    title="Measure What Changed" 
                    description="Success is validated against the original problem. Speed. Cost. Scale. Not vanity metrics."
                    isLast={true} 
                    delay={400}
                />
            </div>
        </div>
      </section>

      {/* Section 7: Cross-Functional Team */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <FadeIn className="bg-gradient-to-r from-navy to-midnight p-8 md:p-20 rounded-[3rem] relative overflow-hidden shadow-glow border border-white/10">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                    <h2 className="text-3xl md:text-5xl font-serif mb-8 leading-tight text-white">One point of clarity. <br/>Multiple layers of expertise.</h2>
                    <p className="text-silver leading-relaxed mb-10 text-lg">
                        Strategy and integration are led by me. When implementation requires deeper specialization, I collaborate with a trusted network of developers, designers, and automation specialists.
                    </p>
                    <Button to="/contact" variant="outline" className="text-white border-white hover:bg-white hover:text-midnight">
                        Discuss Your Project
                    </Button>
                </div>
                 <div className="flex justify-center items-center">
                     {/* Professional Team Grid */}
                    <div className="grid grid-cols-2 gap-6 relative">
                        <img 
                            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80" 
                            alt="Professional Consultant" 
                            referrerPolicy="no-referrer"
                            className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] object-cover hover:scale-105 transition-all duration-500 shadow-xl rotate-[-3deg] border border-white/10 opacity-90 hover:opacity-100"
                        />
                        <img 
                            src="https://images.unsplash.com/photo-1573496359-7973112e1714?auto=format&fit=crop&w=300&q=80" 
                            alt="Automation Specialist" 
                            referrerPolicy="no-referrer"
                            className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] object-cover hover:scale-105 transition-all duration-500 shadow-xl mt-12 rotate-[3deg] border border-white/10 opacity-90 hover:opacity-100"
                        />
                        <img 
                            src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80" 
                            alt="Systems Architect" 
                            referrerPolicy="no-referrer"
                            className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] object-cover hover:scale-105 transition-all duration-500 shadow-xl -mt-6 rotate-[2deg] border border-white/10 opacity-90 hover:opacity-100"
                        />
                        <img 
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80" 
                            alt="Developer" 
                            referrerPolicy="no-referrer"
                            className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] object-cover hover:scale-105 transition-all duration-500 shadow-xl mt-6 rotate-[-2deg] border border-white/10 opacity-90 hover:opacity-100"
                        />
                    </div>
                </div>
            </div>
        </FadeIn>
      </section>

      {/* Section 8: Final CTA */}
      <section className="py-32 text-center px-4">
        <FadeIn direction="up">
            <h2 className="text-4xl md:text-6xl font-serif text-white mb-8">Ready to Build an Operation That Actually Scales?</h2>
            <p className="text-silver mb-12 text-xl max-w-xl mx-auto">Start with a 30-minute audit. Walk away with three things you can fix immediately — whether you work with me after or not.</p>
            <Button to="/contact" variant="primary" size="large" className="shadow-glow">
                Book the Audit — It's Free
            </Button>
        </FadeIn>
      </section>
    </Layout>
    </>
  );
};

export default Home;