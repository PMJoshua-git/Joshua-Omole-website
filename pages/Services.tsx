import React from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import FadeIn from '../components/FadeIn';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const Services: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Services | Joshua Omole | Business Operations & AI Systems Strategist</title>
        <meta name="description" content="Every service starts by understanding how your business actually runs then building the clearest, most direct path to making it run better." />
        <meta property="og:title" content="Services | Joshua Omole | Business Operations & AI Systems Strategist" />
        <meta property="og:description" content="Every service starts by understanding how your business actually runs then building the clearest, most direct path to making it run better." />
        <link rel="canonical" href="https://joshuaomole.com/services" />
      </Helmet>
      
      <Layout>
        
        {/* SECTION 1 — HERO */}
        <section className="py-24 px-4 bg-sage-surface-2 border-b border-sage-border">
          <FadeIn className="max-w-7xl mx-auto text-center">
            <div className="text-sage-primary font-serif italic text-sm mb-6 inline-block">
              Every engagement starts with one question
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-sage-text mb-6 tracking-tight text-wrap-balance">
              What is your operation actually costing you?
            </h1>
            <p className="text-lg md:text-xl text-sage-muted max-w-2xl mx-auto mb-8 leading-relaxed">
              Clear engagements. Defined outcomes. Every service starts by understanding how your business works, then choosing the clearest path to improve it.
            </p>
            <Button to="/audit" size="large" className="bg-sage-primary text-white hover:bg-sage-primary-hover shadow-sm">
              Book a Free Clarity Audit
            </Button>
          </FadeIn>
        </section>

        {/* SECTION 2 — START HERE / ENTRY POINT */}
        <section className="py-20 px-4 max-w-7xl mx-auto">
          <FadeIn direction="up">
            <div className="bg-sage-surface border border-sage-border p-8 md:p-12 rounded-2xl shadow-soft relative overflow-hidden">
              <div className="max-w-4xl">
                <span className="text-sage-primary font-bold tracking-widest uppercase text-xs mb-3 block">
                  Start Here — It's Free
                </span>
                <h2 className="text-3xl md:text-4xl font-serif text-sage-text mb-6">
                  Systems Clarity Audit
                </h2>
                <p className="text-sage-muted text-lg leading-relaxed mb-6">
                  Not sure what's slowing the business down? In 30 minutes, we'll identify the operational friction and leave you with three actionable findings.
                </p>
                <div className="bg-sage-surface-2 p-6 rounded-xl border border-sage-border mb-8 max-w-2xl">
                  <span className="text-xs font-bold tracking-wider text-sage-primary uppercase block mb-2">Best For</span>
                  <p className="text-base text-sage-muted">
                    Founders and operators who know something is off but need help pinpointing where.
                  </p>
                </div>
                <Button to="/audit" size="large" variant="primary" className="shadow-sm">
                  Book Your Free Audit &rarr;
                </Button>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* SECTION 3 — SERVICE OVERVIEW */}
        <section className="py-16 bg-sage-surface-2 border-y border-sage-border/50 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <FadeIn>
                <span className="text-sage-primary font-bold tracking-widest uppercase text-xs mb-3 block">
                  Offerings
                </span>
                <h2 className="text-3xl md:text-4xl font-serif text-sage-text mb-4">
                  Choose the level of help you need.
                </h2>
              </FadeIn>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  cat: "DIAGNOSE",
                  title: "Operational Diagnostic Brief",
                  desc: "A structured, deep-dive evaluation of your workflows to pinpoint exactly where friction is hiding."
                },
                {
                  cat: "EXECUTE",
                  title: "Implementation Partnership",
                  desc: "Active execution leadership, coordinating specialists and tools to turn operational designs into stable reality."
                },
                {
                  cat: "FIX",
                  title: "Automation & Workflow Design",
                  desc: "Targeted, high-leverage pipeline automation designed to eliminate manual, repetitive bottleneck processes."
                }
              ].map((item, idx) => (
                <FadeIn key={idx} delay={idx * 100} className="h-full">
                  <div className="bg-sage-surface p-8 rounded-xl border border-sage-border h-full shadow-soft flex flex-col justify-between hover:border-sage-primary/25 transition-all">
                    <div>
                      <span className="text-xs font-bold text-sage-primary font-mono tracking-widest block mb-3">{item.cat}</span>
                      <h3 className="font-heading text-lg font-semibold text-sage-text mb-3">{item.title}</h3>
                      <p className="font-body text-sm text-sage-muted leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES LIST */}
        <section className="py-20 px-4 max-w-7xl mx-auto space-y-24">
          
          {/* SECTION 4 — OPERATIONAL DIAGNOSTIC BRIEF */}
          <FadeIn direction="up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              <div>
                <span className="text-sage-muted font-bold tracking-widest uppercase text-xs mb-3 block">Phase 1</span>
                <h2 className="text-3xl md:text-4xl font-serif text-sage-text mb-6">Operational Diagnostic Brief</h2>
                <p className="text-sage-muted text-lg leading-relaxed mb-8">
                  A structured deep-dive into how your operation actually works—showing where the leaks are, what needs to change and what it will take to fix them.
                </p>
                
                <div className="bg-sage-surface-2 p-6 rounded-xl border border-sage-border mb-8">
                  <span className="text-xs font-bold tracking-wider text-sage-primary uppercase block mb-2">Best For</span>
                  <p className="text-base text-sage-muted">
                    Founders ready to move from "something is wrong" to understanding exactly what needs to change.
                  </p>
                </div>
                
                <Button to="/audit" size="large" variant="outline">Let's Talk &rarr;</Button>
              </div>
              
              <div className="bg-sage-surface border border-sage-border p-8 md:p-10 rounded-xl shadow-soft hover:border-sage-primary/30 transition-all">
                <h3 className="text-xl font-serif text-sage-text mb-8 border-b border-sage-border pb-4">What you get</h3>
                <ul className="space-y-4">
                  {[
                    "Bottlenecks + root causes",
                    "What to fix, improve or remove",
                    "Required tools, resources + specialists",
                    "Cost implications",
                    "ROI / before-and-after view",
                    "Implementation roadmap"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-sage-primary mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-sage-muted font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeIn>

          <div className="w-full h-px bg-sage-border"></div>

          {/* SECTION 5 — IMPLEMENTATION PARTNERSHIP */}
          <FadeIn direction="up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start bg-sage-surface-2 py-12 -mx-4 px-4 sm:mx-0 sm:px-12 rounded-2xl border border-sage-border">
              <div className="order-2 lg:order-1 bg-sage-surface border border-sage-border p-8 md:p-10 rounded-xl shadow-soft hover:border-sage-primary/30 transition-all">
                <h3 className="text-xl font-serif text-sage-text mb-8 border-b border-sage-border pb-4">What you get</h3>
                <ul className="space-y-4">
                  {[
                    "Project planning + execution",
                    "Specialist/vendor coordination",
                    "Internal workflow transition",
                    "Customer-facing workflow transition",
                    "Progress reporting",
                    "Outcome validation"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-sage-accent mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-sage-muted font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="order-1 lg:order-2">
                <span className="text-sage-muted font-bold tracking-widest uppercase text-xs mb-3 block">Phase 2</span>
                <h2 className="text-3xl md:text-4xl font-serif text-sage-text mb-6">Implementation Partnership</h2>
                <p className="text-sage-muted text-lg leading-relaxed mb-8">
                  Once the direction is clear, I help manage the execution—coordinating specialists, systems and workflow changes while you continue running the business.
                </p>
                
                <div className="bg-sage-surface-2 border border-sage-border p-6 rounded-xl mb-8">
                  <span className="text-xs font-bold tracking-wider text-sage-primary uppercase block mb-2">Best For</span>
                  <p className="text-base text-sage-muted">
                    Founders who know what needs to change and want someone to own the execution.
                  </p>
                </div>
                
                <Button to="/audit" variant="primary">Let's Talk &rarr;</Button>
              </div>
            </div>
          </FadeIn>

          <div className="w-full h-px bg-sage-border"></div>

          {/* SECTION 6 — AUTOMATION & WORKFLOW DESIGN */}
          <FadeIn direction="up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              <div>
                <span className="text-sage-muted font-bold tracking-widest uppercase text-xs mb-3 block">Standalone</span>
                <h2 className="text-3xl md:text-4xl font-serif text-sage-text mb-6">Automation & Workflow Design</h2>
                <p className="text-sage-muted text-lg leading-relaxed mb-8">
                  A focused engagement for one manual, repetitive process that should work better—with workflow redesign, AI, automation or technical integration where appropriate.
                </p>
                
                <div className="bg-sage-surface-2 p-6 rounded-xl border border-sage-border mb-8">
                  <span className="text-xs font-bold tracking-wider text-sage-primary uppercase block mb-2">Best For</span>
                  <p className="text-base text-sage-muted">
                    Operators losing significant time to a repetitive process that should not require manual effort.
                  </p>
                </div>
                
                <Button to="/audit" variant="outline">Discuss Automation &rarr;</Button>
              </div>
              
              <div className="bg-sage-surface border border-sage-border p-8 md:p-10 rounded-xl shadow-soft hover:border-sage-primary/30 transition-all">
                <h3 className="text-xl font-serif text-sage-text mb-8 border-b border-sage-border pb-4">What's included</h3>
                <ul className="space-y-4">
                  {[
                    "Process mapping + root cause analysis",
                    "Automation architecture",
                    "Build + implementation",
                    "Error handling + alerts",
                    "SOPs + team handoff"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-sage-primary mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-sage-muted font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeIn>

          {/* SECTION 7 — WHICH FITS? */}
          <FadeIn direction="up">
            <div className="bg-sage-surface border border-sage-border p-8 md:p-12 rounded-2xl shadow-soft">
              <div className="text-center mb-8">
                <span className="text-sage-primary font-bold tracking-widest uppercase text-xs mb-3 block">Decision Aid</span>
                <h2 className="text-2xl md:text-3xl font-serif text-sage-text">Not sure where to start?</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { trigger: "I know something is wrong.", fit: "Systems Clarity Audit" },
                  { trigger: "I need to understand the operation fully.", fit: "Operational Diagnostic Brief" },
                  { trigger: "I know what needs to change and need execution.", fit: "Implementation Partnership" },
                  { trigger: "I have one repetitive process that needs fixing.", fit: "Automation & Workflow Design" }
                ].map((item, i) => (
                  <div key={i} className="bg-sage-surface-2 border border-sage-border p-6 rounded-xl flex flex-col justify-between hover:border-sage-primary/20 transition-all">
                    <p className="font-body text-sm text-sage-muted italic mb-4">"{item.trigger}"</p>
                    <div className="font-heading text-sm font-semibold text-sage-primary flex items-center">
                      <ArrowRight className="w-4 h-4 mr-1 shrink-0" /> {item.fit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* SECTION 8 — FINAL CTA */}
          <FadeIn direction="up">
            <div className="text-center bg-sage-surface py-16 px-6 rounded-2xl border border-sage-border shadow-soft">
              <h2 className="text-2xl md:text-3xl font-serif text-sage-text mb-4">Not sure which fits?</h2>
              <p className="text-base text-sage-muted mb-8 max-w-2xl mx-auto leading-relaxed">
                Start with the free Audit. It will help identify where the problem is and what needs attention first.
              </p>
              <Button to="/audit" variant="primary" size="large" className="shadow-sm">
                Book Your Free Audit &rarr;
              </Button>
            </div>
          </FadeIn>

        </section>
      </Layout>
    </>
  );
};

export default Services;
