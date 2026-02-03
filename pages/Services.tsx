import React from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import FadeIn from '../components/FadeIn';
import { CheckCircle2 } from 'lucide-react';

const Services: React.FC = () => {
  return (
    <Layout>
      <section className="py-20 px-4 bg-midnight/30 border-b border-navy">
        <FadeIn className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-6">Services & Engagements</h1>
          <p className="text-xl text-silver max-w-2xl mx-auto">
            Clear deliverables. Defined outcomes. No ambiguity.
          </p>
        </FadeIn>
      </section>

      <section className="py-20 px-4 max-w-7xl mx-auto space-y-24">
        
        {/* Service 1 */}
        <FadeIn direction="up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
                <div>
                    <span className="text-blue font-bold tracking-widest uppercase text-xs mb-3 block">Primary Engagement</span>
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">AI Integration & Transition Strategy</h2>
                    <p className="text-silver text-lg leading-relaxed mb-8">
                        A comprehensive engagement to move your organization from ad-hoc tool usage to a strategic AI-enabled operation. I identify where AI creates actual value, select the right stack, and map the path to implementation.
                    </p>
                    <div className="bg-navy/30 p-6 rounded-sm border border-navy mb-8">
                        <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wide">Who this is for:</h4>
                        <p className="text-base text-silver">Founders and CEOs who know they need to adopt AI but don't want to waste money on the wrong tools or disrupt their current operations.</p>
                    </div>
                    <Button to="/contact" size="default">Book a Strategy Call</Button>
                </div>
                <div className="bg-midnight border border-navy p-8 md:p-10 rounded-sm shadow-glow hover:shadow-glow-hover transition-all">
                    <h3 className="text-xl font-serif text-white mb-8 border-b border-navy pb-4">What's Included</h3>
                    <ul className="space-y-4">
                        {[
                            "Operational Audit & Gap Analysis",
                            "High-Impact Use Case Identification",
                            "Tech Stack Selection & Vendor Vetting",
                            "ROI & Cost Modeling",
                            "Risk Assessment & Data Privacy Review",
                            "Full Execution Roadmap"
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

        <div className="w-full h-px bg-navy"></div>

         {/* Service 2 */}
         <FadeIn direction="up">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
                <div>
                    <span className="text-silver/50 font-bold tracking-widest uppercase text-xs mb-3 block">Execution</span>
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">AI-Powered Automation</h2>
                    <p className="text-silver text-lg leading-relaxed mb-8">
                        I take manual, repetitive workflows and rebuild them using intelligent automation and AI agents. This isn't just about speed; it's about consistency and freeing your team to do high-value work.
                    </p>
                     <div className="bg-navy/30 p-6 rounded-sm border border-navy mb-8">
                        <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wide">Who this is for:</h4>
                        <p className="text-base text-silver">Operational leaders drowning in manual data entry, customer routing, or content versioning tasks.</p>
                    </div>
                    <Button to="/contact" variant="outline">Discuss Automation</Button>
                </div>
                <div className="bg-midnight border border-navy p-8 md:p-10 rounded-sm shadow-sm hover:shadow-glow transition-all">
                    <h3 className="text-xl font-serif text-white mb-8 border-b border-navy pb-4">What's Included</h3>
                    <ul className="space-y-4">
                        {[
                            "Current State Process Mapping",
                            "Automation Architecture Design",
                            "Implementation (Make, Zapier, Custom API)",
                            "Error Handling & Alerting Systems",
                            "Standard Operating Procedures (SOPs)",
                            "Team Training & Handoff"
                        ].map((item, i) => (
                            <li key={i} className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-blue mr-3 flex-shrink-0 mt-0.5" />
                                <span className="text-silver">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </FadeIn>

         <div className="w-full h-px bg-navy"></div>

         {/* Service 3 */}
         <FadeIn direction="up">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
                <div>
                    <span className="text-silver/50 font-bold tracking-widest uppercase text-xs mb-3 block">Management</span>
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">Technology Project Oversight</h2>
                    <p className="text-silver text-lg leading-relaxed mb-8">
                        I act as your fractional Technical Project Management office. I sit between you and the developers/vendors to ensure they are building the right thing, on time, and within budget.
                    </p>
                     <div className="bg-navy/30 p-6 rounded-sm border border-navy mb-8">
                        <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wide">Who this is for:</h4>
                        <p className="text-base text-silver">Non-technical founders managing development teams or implementing complex enterprise software.</p>
                    </div>
                    <Button to="/contact" variant="outline">See How I Work</Button>
                </div>
                <div className="bg-midnight border border-navy p-8 md:p-10 rounded-sm shadow-sm hover:shadow-glow transition-all">
                    <h3 className="text-xl font-serif text-white mb-8 border-b border-navy pb-4">What's Included</h3>
                    <ul className="space-y-4">
                        {[
                            "Scope Definition & Protection",
                            "Vendor Management & Communication",
                            "Sprint Planning & Agile Leadership",
                            "Quality Assurance Oversight",
                            "Deployment Strategy",
                            "Post-Launch Stabilization"
                        ].map((item, i) => (
                            <li key={i} className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-blue mr-3 flex-shrink-0 mt-0.5" />
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