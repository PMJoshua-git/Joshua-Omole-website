import React from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import FadeIn from '../components/FadeIn';
import LiveTrainingSessions from '../components/LiveTrainingSessions';
import { 
    Users, 
    Network, 
    Lightbulb, 
    Workflow,
    Presentation,
    MonitorPlay,
    Briefcase,
    Settings,
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
              <span>Operational Training</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif text-white leading-[1.05] mb-8 tracking-tight drop-shadow-xl">
              Operational Training Built For<br/> <span className="text-transparent bg-clip-text bg-neon-gradient">How Business Actually Works</span>
            </h1>
            <p className="text-xl md:text-2xl text-silver leading-relaxed mb-12 max-w-3xl mx-auto">
              Every tutorial online teaches the tool. This teaches you how to use it inside your operation — combining the technical, the operational, and the systems layer in one session.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 items-center justify-center">
              <Button to="#live-sessions" variant="primary" size="large" className="group w-full sm:w-auto hover:shadow-glow-hover hover:-translate-y-1 transition-all duration-300">
                Explore Live Sessions
              </Button>
              <Button to="#tracks" variant="outline" size="large" className="w-full sm:w-auto text-silver border-navy hover:text-white hover:border-blue transition-colors">
                View Training Tracks
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      <LiveTrainingSessions />

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
                    <span className="text-blue font-bold tracking-widest uppercase text-xs mb-3 block">For Leaders & Executives</span>
                    <h3 className="text-2xl font-serif text-white mb-4">Lead AI Decisions With Confidence</h3>
                    <p className="text-silver mb-8 flex-grow leading-relaxed">
                        You don't need to understand how AI works at a technical level. You need to know how to govern it, evaluate it, and integrate it into business strategy without being misled. This track gives you exactly that.
                    </p>
                    <ul className="space-y-4 mb-8 text-sm text-silver/90">
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple shrink-0" /> <span>AI Strategy & ROI</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple shrink-0" /> <span>Decision-Making Frameworks</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple shrink-0" /> <span>Governance & Ethics</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple shrink-0" /> <span>Digital Transformation Leadership</span></li>
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
                    <span className="text-blue font-bold tracking-widest uppercase text-xs mb-3 block">For Operational Teams</span>
                    <h3 className="text-2xl font-serif text-white mb-4">Turn AI Tools Into Daily Workflow</h3>
                    <p className="text-silver mb-8 flex-grow leading-relaxed">
                        Your team doesn't need to become technical. They need to know how to work alongside automation, identify where AI helps, and adopt new systems without losing productivity during the transition.
                    </p>
                    <ul className="space-y-4 mb-8 text-sm text-silver/90">
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue shrink-0" /> <span>Workflow Automation</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue shrink-0" /> <span>AI in Daily Operations</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue shrink-0" /> <span>Productivity Systems</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue shrink-0" /> <span>Collaborative Adoption</span></li>
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
                    <span className="text-purple font-bold tracking-widest uppercase text-xs mb-3 block">For Individual Professionals</span>
                    <h3 className="text-2xl font-serif text-white mb-4">Future-Proof Your Career</h3>
                    <p className="text-silver mb-8 flex-grow leading-relaxed">
                        AI is changing what every job requires. This track builds the literacy, the prompting capability, and the operational thinking that makes you the person organizations want to keep.
                    </p>
                    <ul className="space-y-4 mb-8 text-sm text-silver/90">
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple shrink-0" /> <span>Core AI Literacy</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple shrink-0" /> <span>Advanced Prompting</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple shrink-0" /> <span>Digital Workspace Optimization</span></li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-purple shrink-0" /> <span>Career Readiness</span></li>
                    </ul>
                    <div className="mt-auto h-24 rounded-xl border border-white/5 bg-obsidian/50 relative overflow-hidden flex items-center justify-center group-hover:border-purple/20 transition-all">
                        <Layers className="w-full h-full p-4 text-navy group-hover:text-purple/40 transition-colors opacity-50" />
                    </div>
                </div>
            </FadeIn>
        </div>
      </section>

      {/* Delivery Formats */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
                <h2 className="text-3xl font-serif text-white mb-4">Flexible Delivery Formats</h2>
            </div>
          </FadeIn>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
              {[
                  { icon: Presentation, title: "Workshops", desc: "Interactive half or full-day sessions — for teams ready to move fast." },
                  { icon: MonitorPlay, title: "Virtual Sessions", desc: "Remote-first for distributed teams. Same depth, no travel required." },
                  { icon: Briefcase, title: "Executive Briefings", desc: "Concise, focused sessions for leadership — built around decisions, not demos." },
                  { icon: Settings, title: "Custom Programs", desc: "Curriculum built entirely around your team, your tools, your workflows." },
              ].map((format, idx) => (
                  <FadeIn key={idx} delay={idx * 100} className="group cursor-default">
                      <div className="bg-obsidian border border-navy/50 p-8 rounded-3xl h-full flex flex-col items-center text-center hover:bg-navy/30 hover:border-blue/40 transition-all shadow-lg">
                          <div className="w-16 h-16 bg-midnight border border-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:-translate-y-2 group-hover:border-blue/30 transition-all duration-300 shadow-xl">
                              <format.icon className="w-6 h-6 text-blue group-hover:text-white transition-colors" />
                          </div>
                          <h4 className="text-white text-xl font-serif mb-3">{format.title}</h4>
                          <p className="text-sm text-silver/80 leading-relaxed">{format.desc}</p>
                      </div>
                  </FadeIn>
              ))}
          </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden text-center px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue/20 rounded-full blur-[150px] pointer-events-none -z-10"></div>
        <div className="absolute inset-0 opacity-10 bg-gradient-to-t from-obsidian via-transparent to-obsidian"></div>
        
        <FadeIn direction="up" className="relative z-10 max-w-4xl mx-auto border border-blue/30 bg-midnight/40 backdrop-blur-xl p-12 md:p-20 rounded-[3rem] shadow-[0_0_50px_rgba(60,117,165,0.15)]">
            <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">Training That Changes How Your Team Works — Not Just What They Know.</h2>
            <p className="text-silver mb-10 text-xl max-w-xl mx-auto">Practical, business-focused, designed for the way your organization actually operates.</p>
            <Button to="/contact" variant="primary" size="large" className="shadow-lg group">
                Schedule a Training Consultation <ArrowUpRight className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>
        </FadeIn>
      </section>

    </Layout>
  );
};

export default Training;
