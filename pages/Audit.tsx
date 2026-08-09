import React from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import FadeIn from '../components/FadeIn';
import { Helmet } from 'react-helmet-async';

const Audit: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Free Systems Clarity Audit | Joshua Omole</title>
        <meta name="description" content="Book a free 30-minute Systems Clarity Audit with Joshua Omole. Find out exactly where your operation is leaking time, money, and momentum — and walk away with three things you can act on immediately." />
        <meta property="og:title" content="Free Systems Clarity Audit | Joshua Omole" />
        <meta property="og:description" content="Book a free 30-minute Systems Clarity Audit. Find out where your operation is breaking down and walk away with three immediate actions — no pitch, no commitment." />
        <meta property="og:url" content="https://joshuaomole.com/audit" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://joshuaomole.com/images/joshua-portrait.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Systems Clarity Audit | Joshua Omole" />
        <meta name="twitter:description" content="Book a free 30-minute Systems Clarity Audit. Walk away with three immediate actions for your business — no pitch, no commitment." />
        <link rel="canonical" href="https://joshuaomole.com/audit" />
      </Helmet>
      <Layout>
      <section className="bg-midnight text-white py-32 px-4 relative overflow-hidden rounded-b-[3rem] border-b border-navy">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>
        
        <FadeIn className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block text-blue font-mono text-sm tracking-widest uppercase mb-6 px-3 py-1 rounded-full bg-blue/10 border border-blue/30">
            Free · 30 Minutes · No Commitment
          </div>
          <h1 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">Find Out What Your Operation Is Actually Costing You</h1>
          <p className="text-xl text-silver max-w-2xl mx-auto font-light leading-relaxed">
            Not what AI could do for you one day. What your current operation is costing you right now — in time, in revenue, and in decisions you're making without the data to back them up.
          </p>
        </FadeIn>
      </section>

      <section className="py-24 px-4 max-w-4xl mx-auto">
        <FadeIn>
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl font-serif text-white mb-8">You already sense something is off.</h2>
            <div className="space-y-6 text-lg text-silver leading-relaxed">
              <p>
                Maybe orders are getting missed. Maybe your team is spending hours on tasks that shouldn't require human hands. Maybe you've tried to fix it before and nothing stuck. Maybe you just know the business could run cleaner, faster, and with less of you holding every part together.
              </p>
              <p>
                The Systems Clarity Audit is a focused 30-minute session where we look at your operation together — not your tools, not your tech stack, not your AI readiness. Your operation. How work actually moves through your business, where it slows down, and where the real cost is hiding.
              </p>
              <p className="text-white bg-navy/20 p-6 rounded-2xl border border-navy/50 font-medium">
                You walk away with three specific, actionable findings you can move on immediately — whether you work with me after or not.
              </p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="mb-20">
            <span className="text-silver/50 font-bold tracking-widest uppercase text-xs mb-4 block">What We Cover</span>
            <h3 className="text-2xl font-serif text-white mb-8">What I Look At</h3>
            <ul className="space-y-6 text-silver">
              <li className="flex items-start">
                <span className="text-blue mr-4 mt-1 text-xl leading-none">•</span>
                <span><strong className="text-white">How work moves</strong> — where your operation flows and where it breaks down</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue mr-4 mt-1 text-xl leading-none">•</span>
                <span><strong className="text-white">Where decisions stall</strong> — approval chains, unclear ownership, single points of failure</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue mr-4 mt-1 text-xl leading-none">•</span>
                <span><strong className="text-white">What lives in people's heads</strong> — undocumented processes, relationships, and knowledge that shouldn't</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue mr-4 mt-1 text-xl leading-none">•</span>
                <span><strong className="text-white">Your data visibility</strong> — can you actually see what's happening in your business, or are you running on instinct?</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue mr-4 mt-1 text-xl leading-none">•</span>
                <span><strong className="text-white">Your tool stack</strong> — are your tools talking to each other, or creating more friction than they solve?</span>
              </li>
            </ul>
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
            <div className="bg-midnight border border-navy p-8 rounded-[2rem] shadow-sm">
              <h3 className="text-xl font-serif text-white mb-6 border-b border-navy pb-4">What You Leave With</h3>
              <ul className="space-y-4 text-silver">
                <li className="flex items-start">
                  <span className="text-purple mr-3 mt-1 leading-none">•</span>
                  <span>A clear picture of your operation's highest-pressure point</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple mr-3 mt-1 leading-none">•</span>
                  <span>Three immediate, actionable improvements</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple mr-3 mt-1 leading-none">•</span>
                  <span>An honest assessment of whether and how technology or AI fits into the fix</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-obsidian border border-navy/50 p-8 rounded-[2rem]">
              <h3 className="text-xl font-serif text-white mb-6 border-b border-navy/50 pb-4">What Happens After</h3>
              <p className="text-silver leading-relaxed">
                This is not a sales call. But if what the Audit surfaces is deeper than three quick fixes can solve, I'll tell you — and explain what a full Operational Diagnostic Brief would look like as the next step. You decide if that's right for you.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* CTA Block */}
        <FadeIn direction="up">
          <div className="bg-midnight border border-blue/30 p-10 md:p-16 rounded-[3rem] text-center shadow-glow relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue/5 to-purple/5 pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">Thirty minutes. Three findings. Complete clarity on where to start.</h2>
              <p className="text-xl text-silver mb-10">No pitch. No pressure. Just an honest look at your operation.</p>
              <Button to="/contact" size="large" variant="primary" className="mb-6">Book Your Free Audit &rarr;</Button>
              <p className="text-sm text-silver/60 italic font-serif">
                *Spots are limited — the Audit is a live session, not an automated tool.
              </p>
            </div>
          </div>
        </FadeIn>
      </section>
    </Layout>
    </>
  );
};

export default Audit;