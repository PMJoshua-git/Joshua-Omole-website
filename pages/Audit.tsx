import React from 'react';
import Layout from '../components/Layout';
import FadeIn from '../components/FadeIn';
import { Helmet } from 'react-helmet-async';
import CustomContactForm from '../components/forms/CustomContactForm';

const Audit: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Free Systems Clarity Audit | Joshua Omole</title>
        <meta name="description" content="Find out exactly where your operation is leaking time, money, and momentum and walk away with three things you can act on immediately. Book a free 30-minute Systems Clarity Audit with Joshua Omole." />
        <meta property="og:title" content="Free Systems Clarity Audit | Joshua Omole" />
        <meta property="og:description" content="Find out exactly where your operation is leaking time, money, and momentum and walk away with three things you can act on immediately. Book a free 30-minute Systems Clarity Audit with Joshua Omole." />
        <meta property="og:url" content="https://joshuaomole.com/audit" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://joshuaomole.com/images/joshua-portrait.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Systems Clarity Audit | Joshua Omole" />
        <meta name="twitter:description" content="Book a free 30-minute Systems Clarity Audit. Walk away with three immediate actions for your business — no pitch, no commitment." />
        <link rel="canonical" href="https://joshuaomole.com/audit" />
      </Helmet>
      
      <Layout>
        
        {/* SECTION 1 — HERO */}
        <section className="bg-sage-bg border-b border-sage-border/30 py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <FadeIn direction="up">
              <span className="inline-block text-sage-primary font-mono text-xs font-bold tracking-widest uppercase mb-6 px-3 py-1 rounded-full bg-sage-surface border border-sage-border/50">
                FREE · 30 MINUTES · NO COMMITMENT
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-sage-text mb-6 leading-tight tracking-tight text-wrap-balance">
                Find Out What Your Operation Is Actually Costing You
              </h1>
              <p className="text-lg md:text-xl text-sage-muted max-w-2xl mx-auto mb-8 leading-relaxed">
                Not what AI could do for you someday. What your current operation is costing you now. In time, inefficiency, and decisions made without enough visibility.
              </p>
              <button
                onClick={() => {
                  const el = document.getElementById('booking-form');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center font-medium transition-all duration-300 transform active:scale-95 px-8 py-3.5 text-base md:text-lg rounded-lg bg-sage-primary text-white hover:bg-sage-primary-hover shadow-sm"
              >
                Book Your Free Audit &rarr;
              </button>
            </FadeIn>
          </div>
        </section>

        {/* SECTION 2 — YOU ALREADY SENSE SOMETHING IS OFF */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <FadeIn>
            <div className="mb-16">
              <span className="text-sage-primary font-bold tracking-widest uppercase text-xs mb-3 block">Perspective</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-sage-text mb-6 tracking-tight">
                You already sense something is off.
              </h2>
              <div className="space-y-6 text-base sm:text-lg text-sage-muted leading-relaxed">
                <p>
                  Operational challenges rarely hide. They show up every day as manual work consuming key hours, missed task handoffs, repetitive workflow sequences, constant operator dependency, or expensive workarounds that have quietly become your team's normal.
                </p>
                <p>
                  This is not a technical audit. It is a focused look at how work actually moves through your business, where it slows down, and where the biggest sources of friction are.
                </p>
                <div className="bg-sage-surface p-6 rounded-xl border border-sage-border text-sage-text font-medium text-center shadow-soft">
                  You leave with three specific findings you can act on immediately—whether we work together afterward or not.
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* SECTION 3 — WHAT I LOOK AT */}
        <section className="py-16 bg-sage-surface-2 border-y border-sage-border/30 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <FadeIn>
              <span className="text-sage-primary font-bold tracking-widest uppercase text-xs mb-3 block">Scope</span>
              <h2 className="text-2xl sm:text-3xl font-serif text-sage-text mb-10">What I look at</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    title: "HOW WORK MOVES",
                    desc: "Where work flows smoothly—and where it breaks."
                  },
                  {
                    title: "WHERE DECISIONS STALL",
                    desc: "Approvals, unclear ownership, and single points of failure."
                  },
                  {
                    title: "WHAT LIVES IN PEOPLE'S HEADS",
                    desc: "Undocumented processes, knowledge, and relationships."
                  },
                  {
                    title: "YOUR DATA VISIBILITY",
                    desc: "What you can actually see versus what you're guessing."
                  },
                  {
                    title: "YOUR TOOL STACK",
                    desc: "Where tools help—and where they create friction."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-sage-surface p-6 rounded-xl border border-sage-border shadow-soft">
                    <span className="text-xs font-bold text-sage-primary tracking-wider block mb-2">{item.title}</span>
                    <p className="font-body text-sm text-sage-muted leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* SECTION 4 — WHAT YOU LEAVE WITH */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <FadeIn>
            <span className="text-sage-primary font-bold tracking-widest uppercase text-xs mb-3 block">Value Deliverables</span>
            <h2 className="text-2xl sm:text-3xl font-serif text-sage-text mb-10">What you'll leave with</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                {
                  num: "01",
                  text: "A clear picture of your biggest operational pressure point."
                },
                {
                  num: "02",
                  text: "Three immediate improvements you can act on."
                },
                {
                  num: "03",
                  text: "A practical view of whether—and where—technology or AI actually fits."
                }
              ].map((item, i) => (
                <div key={i} className="bg-sage-surface border border-sage-border p-6 rounded-xl shadow-soft">
                  <span className="text-sage-primary font-serif italic text-2xl font-bold block mb-3">{item.num}</span>
                  <p className="font-body text-sm text-sage-muted leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="bg-sage-surface-2 border border-sage-border p-6 rounded-xl max-w-2xl mx-auto text-center shadow-soft">
              <span className="text-xs font-bold tracking-wider text-sage-primary uppercase block mb-2">What Happens After</span>
              <p className="font-body text-sm text-sage-muted leading-relaxed">
                If the problem needs deeper work, I'll explain what that looks like. You decide what happens next.
              </p>
            </div>
          </FadeIn>
        </section>

        {/* SECTION 5 — BOOKING FORM */}
        <section id="booking-form" className="py-20 px-4 sm:px-6 lg:px-8 bg-sage-surface border-t border-sage-border scroll-mt-24">
          <div className="max-w-xl mx-auto text-center mb-10">
            <FadeIn>
              <h2 className="text-3xl font-serif text-sage-text mb-3">Book Your Free Systems Clarity Audit</h2>
              <p className="text-sage-muted text-sm italic font-serif mb-2">"Thirty minutes. Three findings. A clearer place to start."</p>
              <p className="text-sage-muted text-sm leading-relaxed mt-4">
                Tell me a little about the business and what's currently getting in the way.
              </p>
            </FadeIn>
          </div>
          <FadeIn delay={100} className="max-w-xl mx-auto">
            <div className="bg-sage-bg p-6 sm:p-8 rounded-2xl border border-sage-border shadow-soft">
              <CustomContactForm />
              
              <div className="mt-6 text-center text-xs font-semibold text-sage-primary/75 tracking-wider uppercase">
                30 minutes. No sales pitch. No obligation.
              </div>
            </div>
          </FadeIn>
        </section>

      </Layout>
    </>
  );
};

export default Audit;
