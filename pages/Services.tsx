import React from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import FadeIn from '../components/FadeIn';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const Services: React.FC = () => {
  return (
    <Layout>
      <section className="py-20 px-4 bg-midnight/30 border-b border-navy">
        <FadeIn className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-6">Clear Engagements. Defined Outcomes.</h1>
          <p className="text-xl text-silver max-w-2xl mx-auto">
            Every service starts with the same question — what does your operation need to run better? The answer determines where we begin.
          </p>
        </FadeIn>
      </section>

      <section className="py-20 px-4 max-w-7xl mx-auto space-y-24">
        
        {/* Entry Point / Lead Magnet Area */}
        <FadeIn direction="up">
            <div className="bg-obsidian border-2 border-blue/40 p-8 md:p-12 rounded-[2rem] shadow-glow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue/10 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="lg:col-span-2 max-w-4xl">
                        <span className="text-blue font-bold tracking-widest uppercase text-xs mb-3 block">Start Here</span>
                        <h2 className="text-3xl md:text-5xl font-serif text-white mb-6">Systems & Operations Audit</h2>
                        <p className="text-silver text-lg leading-relaxed mb-6">
                            Before strategy, before tools, before anything — you need to know exactly where your operation is breaking and what it's costing you. This is a focused 30-minute diagnostic that maps your current setup, surfaces the highest-leverage fixes, and gives you a clear path forward. No commitment required.
                        </p>
                        <div className="bg-navy/30 p-6 rounded-2xl border border-navy/50 mb-8 max-w-2xl">
                            <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wide flex items-center"><ArrowRight className="w-4 h-4 mr-2 text-purple" /> Who this is for:</h4>
                            <p className="text-base text-silver">Founders and operators who know something is off but can't pinpoint exactly where.</p>
                        </div>
                        <p className="text-white/90 font-medium mb-8 bg-blue/10 inline-block px-4 py-2 rounded-lg border border-blue/20">
                            You walk away with three immediate, actionable improvements — whether you hire me or not.
                        </p>
                        <br/>
                        <Button to="/contact" size="large" variant="primary" className="shadow-lg">Book the Audit (No pitch. No pressure.)</Button>
                    </div>
                </div>
            </div>
        </FadeIn>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-navy to-transparent"></div>

        {/* Service 1 */}
        <FadeIn direction="up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
                <div>
                    <span className="text-silver/50 font-bold tracking-widest uppercase text-xs mb-3 block">Full Engagement</span>
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">AI & Systems Integration</h2>
                    <p className="text-silver text-lg leading-relaxed mb-8">
                        A comprehensive engagement that moves your business from scattered tool usage to an intentional, AI-enabled operation. We identify where AI creates actual value, design the right systems around it, and build the execution roadmap to make it real.
                    </p>
                    <div className="bg-navy/30 p-6 rounded-2xl border border-navy mb-8">
                        <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wide">Who this is for:</h4>
                        <p className="text-base text-silver">Founders who know they need to modernize operations but don't want to waste budget discovering what doesn't work.</p>
                    </div>
                    <Button to="/contact" size="default" variant="outline">Let's Talk</Button>
                </div>
                <div className="bg-midnight border border-navy p-8 md:p-10 rounded-[2rem] shadow-sm hover:shadow-glow transition-all">
                    <h3 className="text-xl font-serif text-white mb-8 border-b border-navy pb-4">What's Included</h3>
                    <ul className="space-y-4">
                        {[
                            "Operational Audit & Gap Analysis",
                            "Use Case Identification",
                            "System & Workflow Design",
                            "Tech Stack Selection",
                            "Execution Roadmap",
                            "ROI Modeling"
                        ].map((item, i) => (
                            <li key={i} className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-purple mr-3 flex-shrink-0 mt-0.5" />
                                <span className="text-silver">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </FadeIn>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-navy to-transparent"></div>

         {/* Service 2 */}
         <FadeIn direction="up">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start bg-obsidian py-12 -mx-4 px-4 sm:mx-0 sm:px-12 rounded-[3rem] border border-navy/50">
                <div className="order-2 lg:order-1 bg-midnight border border-navy p-8 md:p-10 rounded-[2rem] shadow-sm hover:shadow-glow transition-all">
                    <h3 className="text-xl font-serif text-white mb-8 border-b border-navy pb-4">What's Included</h3>
                    <ul className="space-y-4">
                        {[
                            "Process Mapping",
                            "Automation Architecture",
                            "Implementation",
                            "Error Handling",
                            "SOPs",
                            "Team Training & Handoff"
                        ].map((item, i) => (
                            <li key={i} className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-blue mr-3 flex-shrink-0 mt-0.5" />
                                <span className="text-silver">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="order-1 lg:order-2">
                    <span className="text-silver/50 font-bold tracking-widest uppercase text-xs mb-3 block">Execution</span>
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">Automation & Workflow Design</h2>
                    <p className="text-silver text-lg leading-relaxed mb-8">
                        Manual, repetitive workflows rebuilt using intelligent automation and AI agents. Designed not just for speed — but for consistency, so the operation runs reliably without constant human oversight.
                    </p>
                     <div className="bg-navy/30 p-6 rounded-2xl border border-navy mb-8">
                        <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wide">Who this is for:</h4>
                        <p className="text-base text-silver">Operations teams losing hours daily to tasks that should not require human hands.</p>
                    </div>
                    <Button to="/contact" variant="primary">Discuss Automation</Button>
                </div>
            </div>
        </FadeIn>

         <div className="w-full h-px bg-gradient-to-r from-transparent via-navy to-transparent"></div>

         {/* Service 3 */}
         <FadeIn direction="up">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
                <div>
                    <span className="text-silver/50 font-bold tracking-widest uppercase text-xs mb-3 block">Oversight</span>
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">Technical Project Management</h2>
                    <p className="text-silver text-lg leading-relaxed mb-8">
                        You have the vendors or the development team. I sit between you and them — ensuring what gets built matches what was designed, on time, within budget, without the back-and-forth that kills timelines.
                    </p>
                     <div className="bg-navy/30 p-6 rounded-2xl border border-navy mb-8">
                        <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wide">Who this is for:</h4>
                        <p className="text-base text-silver">Non-technical founders managing technical projects who need someone who speaks both sides of the room.</p>
                    </div>
                    <Button to="/contact" variant="outline">See How I Work</Button>
                </div>
                <div className="bg-midnight border border-navy p-8 md:p-10 rounded-[2rem] shadow-sm hover:shadow-glow transition-all">
                    <h3 className="text-xl font-serif text-white mb-8 border-b border-navy pb-4">What's Included</h3>
                    <ul className="space-y-4">
                        {[
                            "Scope Definition & Protection",
                            "Vendor Management",
                            "Sprint Planning",
                            "QA Oversight",
                            "Deployment Strategy",
                            "Post-Launch Stabilization"
                        ].map((item, i) => (
                            <li key={i} className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-purple mr-3 flex-shrink-0 mt-0.5" />
                                <span className="text-silver">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </FadeIn>

      </section>
    </Layout>
  );
};

export default Services;