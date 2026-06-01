import React from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import QuoteBlock from '../components/QuoteBlock';
import FadeIn from '../components/FadeIn';
import { 
    Users, 
    Network, 
    Lightbulb, 
    Workflow,
    Presentation,
    MonitorPlay,
    UsersRound,
    Briefcase,
    Settings,
    TrendingUp,
    ShieldCheck,
    CheckCircle2,
    ArrowUpRight,
    BrainCircuit,
    Layers
} from 'lucide-react';

const Training: React.FC = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-32 pb-20 md:pt-48 md:pb-32 max-w-7xl mx-auto overflow-hidden">
        {/* Animated Background Visuals */}
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue rounded-full blur-[200px] opacity-20 -z-10 animate-[pulse_8s_infinite]"></div>
        <div className="absolute top-2/3 right-1/4 w-[600px] h-[600px] bg-purple rounded-full blur-[200px] opacity-15 -z-10 animate-[pulse_10s_infinite_reverse]"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#283856 1px, transparent 1px), linear-gradient(90deg, #283856 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <FadeIn direction="up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue/10 border border-blue/30 text-blue font-mono text-sm mb-8">
              <BrainCircuit className="w-4 h-4" />
              <span>Capability Building</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif text-white leading-tight mb-8 tracking-tight drop-shadow-xl">
              AI & Technical Training for <br/> <span className="text-transparent bg-clip-text bg-neon-gradient">Leaders, Teams, and Individuals</span>
            </h1>
            <p className="text-xl md:text-2xl text-silver leading-relaxed mb-12 max-w-3xl mx-auto">
              Practical, business-focused training designed to improve AI understanding, adoption, and execution across organizations and careers.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 items-center justify-center">
              <Button to="/contact" variant="primary" size="large" className="group w-full sm:w-auto hover:shadow-glow-hover hover:-translate-y-1 transition-all duration-300">
                Schedule a Training Consultation
              </Button>
              <Button to="#tracks" variant="outline" size="large" className="w-full sm:w-auto text-silver border-navy hover:text-white hover:border-blue transition-colors">
                Explore Training Tracks
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Primary Quote */}
      <section className="px-4 py-16">
        <QuoteBlock 
          quote="AI adoption is not just a technology challenge — it’s a people and capability challenge."
        />
      </section>

      {/* Audience Training Tracks */}
      <section id="tracks" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <FadeIn>
            <div className="text-center mb-16">
                <h2 className="text-4xl font-serif text-white mb-4">Targeted Training Tracks</h2>
                <p className="text-silver text-lg">Curriculums designed for specific operational roles and strategic needs.</p>
            </div>
        </FadeIn>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
             {/* Background glow for cards */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-blue/5 rounded-full blur-[100px] -z-10"></div>

            {/* Track 1: Executive */}
            <FadeIn delay={100} className="h-full">
                <div className="h-full bg-midnight/60 border border-navy p-10 rounded-[2.5rem] group hover:-translate-y-2 hover:border-blue/50 hover:shadow-glow transition-all duration-500 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-purple/20 transition-all"></div>
                    <div className="w-14 h-14 bg-gradient-to-br from-navy to-midnight rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:border-blue/30 transition-colors">
                        <Briefcase className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-serif text-white mb-4">Executive Training</h3>
                    <p className="text-silver mb-8 flex-grow leading-relaxed">
                        Navigate digital transformation with confidence. Learn how to govern AI securely and integrate it into business strategy.
                    </p>
                    <ul className="space-y-4 mb-8 text-sm text-silver/90">
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple shrink-0" /> <span>AI Strategy & ROI</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple shrink-0" /> <span>Decision-Making Frameworks</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple shrink-0" /> <span>Digital Transformation Leadership</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple shrink-0" /> <span>AI Governance & Ethics</span></li>
                    </ul>
                    <div className="mt-auto h-24 rounded-xl border border-white/5 bg-obsidian/50 relative overflow-hidden flex items-center justify-center group-hover:border-blue/20 transition-all">
                        <Network className="w-full h-full p-4 text-navy group-hover:text-blue/40 transition-colors opacity-50" />
                    </div>
                </div>
            </FadeIn>

            {/* Track 2: Workplace / Team */}
            <FadeIn delay={200} className="h-full">
                <div className="h-full bg-midnight/60 border border-navy p-10 rounded-[2.5rem] group hover:-translate-y-2 hover:border-blue/50 hover:shadow-glow transition-all duration-500 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue/20 transition-all"></div>
                    <div className="w-14 h-14 bg-gradient-to-br from-navy to-midnight rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:border-blue/30 transition-colors">
                        <Users className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-serif text-white mb-4">Workplace Teams</h3>
                    <p className="text-silver mb-8 flex-grow leading-relaxed">
                        Turn theoretical AI tools into practical daily workflows. Accelerate operations without disrupting the core business.
                    </p>
                    <ul className="space-y-4 mb-8 text-sm text-silver/90">
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue shrink-0" /> <span>Workflow Automation</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue shrink-0" /> <span>AI in Daily Operations</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue shrink-0" /> <span>Productivity Systems Setup</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue shrink-0" /> <span>Collaborative AI Adoption</span></li>
                    </ul>
                    <div className="mt-auto h-24 rounded-xl border border-white/5 bg-obsidian/50 relative overflow-hidden flex items-center justify-center group-hover:border-blue/20 transition-all">
                        <Workflow className="w-full h-full p-4 text-navy group-hover:text-blue/40 transition-colors opacity-50" />
                    </div>
                </div>
            </FadeIn>

            {/* Track 3: Individual */}
            <FadeIn delay={300} className="h-full">
                <div className="h-full bg-midnight/60 border border-navy p-10 rounded-[2.5rem] group hover:-translate-y-2 hover:border-purple/50 hover:shadow-glow transition-all duration-500 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-purple/20 transition-all"></div>
                    <div className="w-14 h-14 bg-gradient-to-br from-navy to-midnight rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:border-purple/30 transition-colors">
                        <Lightbulb className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-serif text-white mb-4">Individual Professionals</h3>
                    <p className="text-silver mb-8 flex-grow leading-relaxed">
                        Future-proof your career. Build strong AI literacy and master advanced prompting to become a top performer.
                    </p>
                    <ul className="space-y-4 mb-8 text-sm text-silver/90">
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple shrink-0" /> <span>Core AI Literacy</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple shrink-0" /> <span>Advanced Prompt Engineering</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple shrink-0" /> <span>Digital Workspace Optimization</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple shrink-0" /> <span>Career Readiness Strategy</span></li>
                    </ul>
                    <div className="mt-auto h-24 rounded-xl border border-white/5 bg-obsidian/50 relative overflow-hidden flex items-center justify-center group-hover:border-purple/20 transition-all">
                        <Layers className="w-full h-full p-4 text-navy group-hover:text-purple/40 transition-colors opacity-50" />
                    </div>
                </div>
            </FadeIn>
        </div>
      </section>

      {/* Secondary Quote */}
      <section className="px-4 py-20 relative overflow-hidden">
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
             <span className="text-[12rem] font-serif font-black text-white whitespace-nowrap -rotate-2">ADAPTATION</span>
         </div>
         <QuoteBlock 
          quote="Technology only creates value when people understand how to use it. The future belongs to organizations that can learn and adapt quickly."
        />
      </section>

      {/* Delivery Formats */}
      <section className="py-24 bg-obsidian border-y border-navy/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <FadeIn>
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-serif text-white mb-4">Flexible Delivery Formats</h2>
                    <p className="text-silver max-w-2xl mx-auto">Training delivered exactly how your team learns best.</p>
                </div>
              </FadeIn>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-8">
                  {[
                      { icon: Presentation, title: "Workshops", desc: "Interactive half-day or full-day sessions." },
                      { icon: MonitorPlay, title: "Virtual Sessions", desc: "Remote-first guidance for distributed teams." },
                      { icon: UsersRound, title: "Team Enablement", desc: "Ongoing departmental coaching." },
                      { icon: Briefcase, title: "Executive Briefings", desc: "Concise 1:1 or small group strategy." },
                      { icon: Settings, title: "Custom Programs", desc: "Curriculums built for your specific stack." },
                  ].map((format, idx) => (
                      <FadeIn key={idx} delay={idx * 100} className="group cursor-default">
                          <div className="bg-midnight/40 border border-navy p-6 rounded-3xl h-full flex flex-col items-center text-center hover:bg-navy/30 hover:border-blue/40 transition-all">
                              <div className="w-12 h-12 bg-obsidian border border-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-blue/30 transition-all shadow-lg">
                                  <format.icon className="w-5 h-5 text-blue group-hover:text-white transition-colors" />
                              </div>
                              <h4 className="text-white font-medium mb-2">{format.title}</h4>
                              <p className="text-xs text-silver/80">{format.desc}</p>
                          </div>
                      </FadeIn>
                  ))}
              </div>
          </div>
      </section>

      {/* Outcomes & Benefits */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                  <FadeIn>
                      <h2 className="text-3xl md:text-5xl font-serif text-white mb-8">Measurable Outcomes</h2>
                      <p className="text-silver text-lg leading-relaxed mb-10">
                          Training shouldn't just be a seminar—it should be an operational upgrade. Programs are designed to yield specific, observable improvements in how your organization works.
                      </p>
                  </FadeIn>
                  <div className="space-y-6">
                      {[
                          { title: "Smarter Decision-Making", metrics: "Improved Context & Strategy" },
                          { title: "Increased AI Confidence", metrics: "Across Every Department" },
                          { title: "Operational Efficiency", metrics: "Faster Workflow Execution" },
                          { title: "Reduced Tool Confusion", metrics: "Streamlined Tech Stacks" }
                      ].map((item, idx) => (
                          <FadeIn key={idx} delay={idx * 150}>
                              <div className="flex items-center gap-6 p-4 rounded-2xl border border-navy/50 bg-midnight/30 hover:bg-midnight/80 transition-colors">
                                  <div className="w-12 h-12 rounded-xl bg-purple/10 flex items-center justify-center shrink-0 border border-purple/20">
                                      <TrendingUp className="w-6 h-6 text-purple" />
                                  </div>
                                  <div>
                                      <h4 className="text-white font-semibold text-lg">{item.title}</h4>
                                      <span className="text-sm font-mono text-blue/80">{item.metrics}</span>
                                  </div>
                              </div>
                          </FadeIn>
                      ))}
                  </div>
              </div>

              {/* Visual Graphic */}
              <div className="relative h-[500px]">
                  <FadeIn className="absolute inset-0 glass-panel rounded-[3rem] border border-navy flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
                      
                      <div className="relative z-10 w-full px-12">
                          <div className="flex justify-between items-end border-b border-navy/50 pb-4 mb-4">
                              <div className="w-12 bg-navy/40 rounded-t-lg relative group">
                                <div className="absolute bottom-0 w-full h-[40%] bg-blue/20 rounded-t-lg transition-all duration-1000"></div>
                              </div>
                              <div className="w-12 bg-navy/40 rounded-t-lg relative group">
                                <div className="absolute bottom-0 w-full h-[60%] bg-blue/40 rounded-t-lg transition-all duration-1000 delay-300"></div>
                              </div>
                              <div className="w-12 bg-navy/40 rounded-t-lg relative group">
                                <div className="absolute bottom-0 w-full h-[85%] bg-purple/60 rounded-t-lg transition-all duration-1000 delay-500 shadow-glow"></div>
                              </div>
                               <div className="w-12 bg-navy/40 rounded-t-lg relative group">
                                <div className="absolute bottom-0 w-full h-[100%] bg-neon-gradient rounded-t-lg transition-all duration-1000 delay-700 shadow-[0_0_20px_rgba(85,65,130,0.5)]"></div>
                              </div>
                          </div>
                           <div className="flex justify-between text-xs font-mono text-silver">
                              <span>Q1</span>
                              <span>Q2</span>
                              <span>Q3</span>
                              <span className="text-blue">Optimized</span>
                          </div>
                      </div>
                  </FadeIn>
              </div>
          </div>
      </section>

      {/* Cross-Functional Network */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
         <FadeIn>
             <div className="bg-gradient-to-br from-navy to-midnight p-10 md:p-16 rounded-[3rem] border border-navy shadow-glow relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
                 <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                 
                 <div className="md:w-1/2 relative z-10">
                    <div className="w-16 h-16 bg-obsidian rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/10">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                     <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">Cross-Functional Expertise</h2>
                     <p className="text-silver text-lg leading-relaxed">
                         "Training engagements are supported by a cross-functional network of specialists, assembled based on the goals, audience, and technical depth required."
                     </p>
                 </div>

                 <div className="md:w-1/2 relative h-64 w-full flex items-center justify-center">
                     {/* Orbit Animation Abstraction */}
                     <div className="absolute w-64 h-64 border border-white/5 rounded-full animate-[spin_20s_linear_infinite]">
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue rounded-full shadow-[0_0_15px_#3c75a5]"></div>
                     </div>
                     <div className="absolute w-40 h-40 border border-white/10 rounded-full animate-[spin_12s_linear_infinite_reverse]">
                         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-purple rounded-full shadow-[0_0_15px_#554182]"></div>
                     </div>
                     <div className="absolute w-16 h-16 bg-navy rounded-full flex items-center justify-center z-10 shadow-glow">
                         <Network className="w-8 h-8 text-white" />
                     </div>
                 </div>
             </div>
         </FadeIn>
      </section>

      {/* Third Quote */}
      <section className="px-4 py-16">
        <QuoteBlock 
          quote="AI training should improve decision-making, not just tool usage."
        />
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden text-center px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue/20 rounded-full blur-[150px] pointer-events-none -z-10"></div>
        <div className="absolute inset-0 opacity-10 bg-gradient-to-t from-obsidian via-transparent to-obsidian"></div>
        
        <FadeIn direction="up" className="relative z-10 max-w-3xl mx-auto glass-panel p-12 md:p-20 rounded-[3rem] border border-blue/30 shadow-[0_0_50px_rgba(60,117,165,0.15)]">
            <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">Ready to Build AI Capability Across Your Organization?</h2>
            <p className="text-silver mb-10 text-xl max-w-xl mx-auto">Prepare your leadership and workforce for the future, today.</p>
            <Button to="/contact" variant="primary" size="large" className="shadow-lg group">
                Discuss Training Options <ArrowUpRight className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>
        </FadeIn>
      </section>

    </Layout>
  );
};

export default Training;
