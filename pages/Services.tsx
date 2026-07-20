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
          <div className="inline-block text-blue font-mono text-sm tracking-widest uppercase mb-6 px-3 py-1 rounded-full bg-blue/10 border border-blue/30">
            Every engagement starts with one question
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-6">What is your operation actually costing you?</h1>
          <p className="text-xl text-silver max-w-2xl mx-auto">
            Clear engagements. Defined outcomes. Every service starts by understanding how your business actually runs — then building the clearest, most direct path to making it run better.
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
                        <span className="text-blue font-bold tracking-widest uppercase text-xs mb-3 block">Start Here — It's Free</span>
                        <h2 className="text-3xl md:text-5xl font-serif text-white mb-6">Systems Clarity Audit</h2>
                        <p className="text-silver text-lg leading-relaxed mb-6">
                            Before anything else — before strategy, before tools, before any engagement — you need a clear picture of where your operation is breaking down and what it's costing you. The Systems Clarity Audit is a focused 30-minute session where we look at how your business currently runs, identify the highest-leverage pressure points, and give you three things you can act on immediately.
                        </p>
                        <p className="text-silver text-lg leading-relaxed mb-6">No pitch. No commitment. Just clarity.</p>
                        <div className="bg-navy/30 p-6 rounded-2xl border border-navy/50 mb-8 max-w-2xl">
                            <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wide flex items-center"><ArrowRight className="w-4 h-4 mr-2 text-purple" /> Who this is for:</h4>
                            <p className="text-base text-silver">Founders and operators who sense something is off but can't pinpoint exactly where.</p>
                        </div>
                        <Button to="/audit" size="large" variant="primary" className="shadow-lg">Book Your Free Audit &rarr;</Button>
                    </div>
                </div>
            </div>
        </FadeIn>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-navy to-transparent"></div>

        {/* Service 1 */}
        <FadeIn direction="up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
                <div>
                    <span className="text-silver/50 font-bold tracking-widest uppercase text-xs mb-3 block">Phase 1</span>
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">Operational Diagnostic Brief</h2>
                    <p className="text-silver text-lg leading-relaxed mb-8">
                        A structured deep-dive into your business operations. I map how your operation actually runs — not how you think it runs — and deliver a written Brief that shows exactly what's broken, what it's costing you, what needs to be fixed or discontinued, what resources and specialists will be needed, and what the projected return looks like once it's resolved.
                    </p>
                    <div className="bg-navy/30 p-6 rounded-2xl border border-navy mb-8">
                        <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wide">Who this is for:</h4>
                        <p className="text-base text-silver">Founders ready to move beyond sensing a problem and into actually understanding it in full.</p>
                    </div>
                    <Button to="/contact" size="default" variant="outline">Let's Talk &rarr;</Button>
                </div>
                <div className="bg-midnight border border-navy p-8 md:p-10 rounded-[2rem] shadow-sm hover:shadow-glow transition-all">
                    <h3 className="text-xl font-serif text-white mb-8 border-b border-navy pb-4">What the Brief covers</h3>
                    <ul className="space-y-4">
                        {[
                            "Current operational bottlenecks and root causes",
                            "What to fix, what to improve, what to discard entirely",
                            "Resources, tools, and specialists required",
                            "Immediate and long-term cost breakdown",
                            "ROI projection and before/after operational comparison",
                            "Proposed implementation roadmap"
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
                    <h3 className="text-xl font-serif text-white mb-8 border-b border-navy pb-4">What this covers</h3>
                    <ul className="space-y-4">
                        {[
                            "Full project planning and execution management",
                            "Specialist and vendor identification, onboarding, and coordination",
                            "Internal workflow transition — how your team operates after",
                            "External workflow transition — how your customers experience the business after",
                            "Progress reporting throughout",
                            "Outcome validation against the Brief's original targets"
                        ].map((item, i) => (
                            <li key={i} className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-blue mr-3 flex-shrink-0 mt-0.5" />
                                <span className="text-silver">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="order-1 lg:order-2">
                    <span className="text-silver/50 font-bold tracking-widest uppercase text-xs mb-3 block">Phase 2</span>
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">Implementation Partnership</h2>
                    <p className="text-silver text-lg leading-relaxed mb-4">
                        Once the Diagnostic Brief is approved, this is where the work happens. I lead the planning and execution of everything the Brief recommends — coordinating the right specialists, managing the project from start to finish, and overseeing the full transition between how your operation runs today and how it will run when we're done. Both your internal workflows and your customer-facing operations are covered.
                    </p>
                    <p className="text-silver text-lg leading-relaxed mb-8">
                        You stay focused on running your business. I make sure what gets built is exactly what was designed.
                    </p>
                     <div className="bg-navy/30 p-6 rounded-2xl border border-navy mb-8">
                        <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wide">Who this is for:</h4>
                        <p className="text-base text-silver">Founders who have a clear picture of what needs to change and want someone to own the execution.</p>
                    </div>
                    <Button to="/contact" variant="primary">Let's Talk &rarr;</Button>
                </div>
            </div>
        </FadeIn>

         <div className="w-full h-px bg-gradient-to-r from-transparent via-navy to-transparent"></div>

         {/* Service 3 */}
         <FadeIn direction="up">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
                <div>
                    <span className="text-silver/50 font-bold tracking-widest uppercase text-xs mb-3 block">Standalone</span>
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">Automation & Workflow Design</h2>
                    <p className="text-silver text-lg leading-relaxed mb-8">
                        Some businesses don't need a full operational overhaul — they have one specific workflow that's eating time, creating errors, or holding revenue back. This engagement targets that workflow directly: mapping the current process, designing the automated replacement, and building it using the right combination of AI, automation tools, and system logic.
                    </p>
                     <div className="bg-navy/30 p-6 rounded-2xl border border-navy mb-8">
                        <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wide">Who this is for:</h4>
                        <p className="text-base text-silver">Operators losing significant time to a manual, repetitive process that should not require human hands.</p>
                    </div>
                    <Button to="/contact" variant="outline">Discuss Automation &rarr;</Button>
                </div>
                <div className="bg-midnight border border-navy p-8 md:p-10 rounded-[2rem] shadow-sm hover:shadow-glow transition-all">
                    <h3 className="text-xl font-serif text-white mb-8 border-b border-navy pb-4">What's included</h3>
                    <ul className="space-y-4">
                        {[
                            "Current process mapping and root cause analysis",
                            "Automation architecture design",
                            "Build and implementation (Make, Zapier, custom API where needed)",
                            "Error handling and alerting setup",
                            "SOPs and team training for handoff"
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

        {/* Closing Section */}
        <FadeIn direction="up">
          <div className="text-center bg-obsidian py-16 px-6 rounded-[2rem] border border-navy/50">
            <p className="text-xl text-silver mb-8 max-w-2xl mx-auto italic font-serif">
              Not sure which of these fits your situation? Start with the free Audit. It will tell you.
            </p>
            <Button to="/audit" variant="primary" size="large">Book Your Free Audit &rarr;</Button>
          </div>
        </FadeIn>

      </section>
    </Layout>
  );
};

export default Services;