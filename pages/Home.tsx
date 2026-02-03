import React from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import QuoteBlock from '../components/QuoteBlock';
import ServiceCard from '../components/ServiceCard';
import ProcessStep from '../components/ProcessStep';
import FadeIn from '../components/FadeIn';
import { LayoutTemplate, ShieldCheck, Users, BrainCircuit, ArrowUpRight, PlayCircle, Code2, Cpu } from 'lucide-react';

const Home: React.FC = () => {
  return (
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
                 {`{ Every process starts with a trigger }`}
              </div>
              <h1 className="text-5xl md:text-7xl font-serif text-white leading-[1.05] mb-8 tracking-tight drop-shadow-xl">
                AI Integration for Businesses That Want <br/> <span className="text-transparent bg-clip-text bg-neon-gradient">Results — Not Confusion</span>
              </h1>
              <p className="text-xl text-silver leading-relaxed mb-10 max-w-lg">
                I help founders and leadership teams integrate AI and technology into their operations using a proven change management framework that does not disrupt operations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Button to="/contact" variant="primary" size="large" className="group">
                  Explore the Future <ArrowUpRight className="ml-2 w-5 h-5 group-hover:rotate-45 transition-transform" />
                </Button>
                <div className="flex items-center gap-3 text-silver hover:text-white transition-colors cursor-pointer px-4">
                   <PlayCircle className="w-12 h-12 text-blue opacity-80" />
                   <span className="text-sm font-medium">Watch Demo</span>
                </div>
              </div>
            </FadeIn>
          </div>
          
          {/* Right Visual Content */}
          <div className="lg:col-span-6 relative h-[500px] lg:h-[600px] flex items-center justify-center">
             <FadeIn direction="right" delay={200} className="w-full h-full relative">
                 {/* Main Image */}
                 <div className="absolute inset-0 z-0 rounded-[3rem] overflow-hidden border border-navy/50 shadow-glow">
                    <img 
                        src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1000" 
                        alt="AI Robot Working on Laptop" 
                        className="w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent"></div>
                 </div>
                 
                 {/* Floating Glass Card 1 - Code Snippet */}
                 <div className="absolute top-10 -left-4 md:-left-12 glass-panel p-4 rounded-2xl w-64 animate-[float_6s_ease-in-out_infinite] shadow-lg border border-purple/30">
                    <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                        <Code2 className="w-4 h-4 text-purple" />
                        <span className="text-xs text-silver font-mono">system_optimization.py</span>
                    </div>
                    <div className="space-y-1.5 font-mono text-[10px] text-silver/80">
                        <div className="flex"><span className="text-blue mr-2">def</span> optimize_workflow():</div>
                        <div className="pl-4"><span className="text-purple">return</span> efficiency * 1.4</div>
                        <div className="pl-4 text-gray-500"># AI Integrated</div>
                    </div>
                 </div>

                 {/* Floating Glass Card 2 - Stats */}
                 <div className="absolute bottom-20 -right-4 md:-right-8 glass-panel p-5 rounded-3xl w-60 animate-[float_5s_ease-in-out_infinite_reverse] shadow-lg border border-blue/30">
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
          quote="I understand business. I understand AI. And I focus on integrating the two in ways that actually work."
        />
      </section>

      {/* Section 3: Bento Grid Credibility */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <FadeIn>
            <h2 className="text-3xl font-serif mb-12 text-center text-white">Core Competencies</h2>
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
                        <h3 className="text-2xl font-serif mb-4 text-white">AI Integration Specialist</h3>
                        <p className="text-silver leading-relaxed">Bridging the gap between theoretical AI capabilities and practical business applications. I don't sell tools; I sell systems.</p>
                    </div>
                </div>
            </FadeIn>
            
            <FadeIn delay={100} className="h-full">
                 <div className="h-full bg-midnight/50 p-10 rounded-[2.5rem] hover:bg-navy/50 transition-all duration-300 border border-navy hover:border-blue/50 group">
                    <div className="w-12 h-12 bg-blue/10 rounded-2xl flex items-center justify-center mb-6 text-blue group-hover:text-white group-hover:bg-blue transition-colors">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-serif mb-3 text-white">Business First</h3>
                    <p className="text-silver text-sm leading-relaxed">Solutions driven by ROI, not tool hype. If it doesn't make money or save time, we don't do it.</p>
                 </div>
            </FadeIn>

            <FadeIn delay={200} className="h-full">
                 <div className="h-full bg-midnight/50 p-10 rounded-[2.5rem] hover:bg-navy/50 transition-all duration-300 border border-navy hover:border-purple/50 group">
                    <div className="w-12 h-12 bg-purple/10 rounded-2xl flex items-center justify-center mb-6 text-purple group-hover:text-white group-hover:bg-purple transition-colors">
                        <LayoutTemplate className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-serif mb-3 text-white">Technical Fluency</h3>
                    <p className="text-silver text-sm leading-relaxed">DevOps, automation, & scalable platforms. I speak the language of your developers.</p>
                 </div>
            </FadeIn>
            
            {/* Wide bottom card */}
            <FadeIn delay={300} className="md:col-span-2 lg:col-span-3">
                <div className="bg-midnight/50 p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 border border-navy hover:border-white/20 hover:shadow-glow transition-all">
                    <div className="w-16 h-16 bg-neon-gradient text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-glow">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-serif mb-2 text-white">Strategy & Execution</h3>
                        <p className="text-silver max-w-2xl">Leadership that controls the outcome. I bring IT Project Management discipline to the chaotic world of AI implementation.</p>
                    </div>
                    <div className="ml-auto">
                        <Button to="/about" variant="text">About Me <ArrowUpRight className="w-4 h-4 ml-1" /></Button>
                    </div>
                </div>
            </FadeIn>
        </div>
      </section>

      {/* Section 4: Problem Framing */}
      <section className="py-24 bg-midnight relative overflow-hidden rounded-[3rem] mx-4 lg:mx-8 my-12 border border-navy">
        {/* Subtle texture */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue to-transparent opacity-50"></div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-serif mb-16 text-white">Why AI Integration Fails</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-16">
            {[
                { title: "Too many tools", desc: "Implementing disjointed software without a unified strategy creates debt, not value." },
                { title: "No system thinking", desc: "AI is treated as a plug-in rather than a fundamental operational shift." },
                { title: "No ownership", desc: "Without a dedicated owner, projects stall in the \"idea\" phase forever." },
                { title: "No execution discipline", desc: "Great strategies die without rigorous project management." }
            ].map((item, i) => (
                 <FadeIn key={i} delay={100 * (i+1)} className="p-8 rounded-[2rem] bg-obsidian/50 hover:bg-navy/30 transition-colors border border-navy hover:border-blue/30 group">
                    <h4 className="text-xl font-serif mb-3 text-blue group-hover:text-purple transition-colors">{item.title}</h4>
                    <p className="text-silver leading-relaxed text-sm">{item.desc}</p>
                </FadeIn>
            ))}
          </div>
          <FadeIn delay={500}>
            <p className="text-xl md:text-2xl font-serif italic text-white/80">
                "AI fails when it’s treated as a tool instead of a system."
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Section 5: Services Overview */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20">
            <FadeIn>
                <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">How I Help You Win</h2>
                <p className="text-silver max-w-2xl mx-auto text-lg">Structured engagements designed to move you from confusion to clarity.</p>
            </FadeIn>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <FadeIn delay={0} className="h-full">
                <ServiceCard 
                    title="Integration & Strategy"
                    description="The foundational blueprint. We identify high-impact use cases and select the right stack."
                    outcomes={[
                        "Identify high-impact AI use cases",
                        "Design integrated workflows",
                        "Tech Stack Selection",
                        "Execution roadmap"
                    ]}
                    ctaText="Start Here"
                    ctaLink="/contact"
                    isPrimary={true}
                />
            </FadeIn>
            <FadeIn delay={150} className="h-full">
                <ServiceCard 
                    title="Automation Design"
                    description="Rebuilding manual workflows with intelligent agents for speed and consistency."
                    outcomes={[
                        "Process mapping",
                        "AI + automation integration",
                        "Scale optimization",
                        "Documentation & handoff"
                    ]}
                    ctaText="Discuss Automation"
                    ctaLink="/contact"
                />
            </FadeIn>
            <FadeIn delay={300} className="h-full">
                 <ServiceCard 
                    title="Project Oversight"
                    description="Fractional technical management to ensure your vendors deliver on time."
                    outcomes={[
                        "Manage implementations",
                        "Coordinate vendors",
                        "Protect scope & cost",
                        "Ensure quality delivery"
                    ]}
                    ctaText="See How I Work"
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
                    title="Understand the Business" 
                    description="I start by auditing your current operations, goals, and bottlenecks. No tools are suggested until the problem is clear." 
                    delay={0}
                />
                <ProcessStep 
                    number="02" 
                    title="Identify Real AI Opportunities" 
                    description="I filter out the hype to find the specific areas where AI can drive revenue or save significant time." 
                    delay={100}
                />
                <ProcessStep 
                    number="03" 
                    title="Design Integrated Systems" 
                    description="I map out the future state—how data flows, how teams interact with AI, and what the stack looks like." 
                    delay={200}
                />
                 <ProcessStep 
                    number="04" 
                    title="Coordinate Execution" 
                    description="I manage the implementation, ensuring technical teams deliver exactly what the strategy requires." 
                    delay={300}
                />
                 <ProcessStep 
                    number="05" 
                    title="Measure Outcomes" 
                    description="I validate success against the original KPIs. Speed, savings, or scale."
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
                            className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] object-cover hover:scale-105 transition-all duration-500 shadow-xl rotate-[-3deg] border border-white/10 opacity-90 hover:opacity-100"
                        />
                        <img 
                            src="https://images.unsplash.com/photo-1573496359-7973112e1714?auto=format&fit=crop&w=300&q=80" 
                            alt="Automation Specialist" 
                            className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] object-cover hover:scale-105 transition-all duration-500 shadow-xl mt-12 rotate-[3deg] border border-white/10 opacity-90 hover:opacity-100"
                        />
                        <img 
                            src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80" 
                            alt="Systems Architect" 
                            className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] object-cover hover:scale-105 transition-all duration-500 shadow-xl -mt-6 rotate-[2deg] border border-white/10 opacity-90 hover:opacity-100"
                        />
                        <img 
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80" 
                            alt="Developer" 
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
            <h2 className="text-4xl md:text-6xl font-serif text-white mb-8">Ready to Integrate AI?</h2>
            <p className="text-silver mb-12 text-xl max-w-xl mx-auto">Stop guessing. Start building systems that work.</p>
            <Button to="/contact" variant="primary" size="large" className="shadow-glow">
                Book a Strategy Call
            </Button>
        </FadeIn>
      </section>
    </Layout>
  );
};

export default Home;