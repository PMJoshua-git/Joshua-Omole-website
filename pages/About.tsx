import React from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import FadeIn from '../components/FadeIn';

const About: React.FC = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-24 px-4 md:py-32 bg-midnight/30 rounded-b-[3rem] border-b border-navy">
        <FadeIn className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-8 leading-[1.1]">
            I Build the Systems Behind Businesses That Scale
          </h1>
          <p className="text-xl md:text-2xl text-silver max-w-3xl mx-auto font-light leading-relaxed">
            Not the tools. Not the vendor list. The operational architecture that makes a business run without the founder holding everything together manually.
          </p>
        </FadeIn>
      </section>

      <section className="py-24 px-4 sm:px-6 max-w-4xl mx-auto space-y-24 text-silver text-lg leading-relaxed font-light">
        {/* Section — Where This Actually Started */}
        <FadeIn delay={100}>
          <div className="bg-midnight p-8 md:p-12 rounded-[2.5rem] shadow-glow border border-navy space-y-6">
            <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">Where This Actually Started</h2>
            <p>
              I didn't start out trying to become an "AI guy."
            </p>
            <p>
              I started as an IT Project Manager — and somewhere in that role, I realized what actually held my attention wasn't the technology itself. It was the business. How it runs day to day. Why some operations move like a well-built machine and others feel like they're held together by sheer will and good intentions.
            </p>
            <p>
              I love business, genuinely. The mechanics of it — how decisions ripple through an entire operation, how one broken process upstream quietly creates chaos three steps downstream. That's how my mind has always worked, long before I ever touched a line of code. I think in systems by default. I can't look at a single action without seeing the chain reaction it sets off.
            </p>
            <p>
              Then AI entered the picture, and something clicked.
            </p>
            <p>
              I didn't fall in love with AI because it was new. I fell in love with it because of what it could do for a business — the value it created when it was actually understood, not just adopted because everyone else was talking about it. Once I commit to understanding a technical tool, I get to its core fast — not just how it works, but why it matters and where it fits.
            </p>
          </div>
        </FadeIn>

        {/* Section — Who I Am and What I Actually Do */}
        <FadeIn delay={200}>
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">Who I Am and What I Actually Do</h2>
            <p>
              Somewhere in that process, I noticed a problem most people in this space weren't talking about.
            </p>
            <p>
              A lot of founders — even technically capable ones — struggle with actually using technology in their operations. Not because they don't understand AI conceptually. Because nobody is translating it into their actual workflow, their actual bottlenecks, their actual business.
            </p>
            <p className="text-white font-normal">
              That gap is exactly where I decided to plant myself.
            </p>
            <p>
              There's no shortage of people who will sell you an AI tool, set it up, and leave you to figure out the rest. What I do is different. I come into a business and map how it actually operates. I find where the time, money, and momentum are leaking. Then I redesign those parts using AI, automation, and systems thinking — so the business runs with more intention and less friction.
            </p>
            <p>
              The result isn't a more complex operation. It's a cleaner, faster one.
            </p>
            <p>
              I'm not a developer who learned business. I'm not a strategist who picked up some AI buzzwords. I'm someone who thinks in systems first, understands both sides of the technical and business conversation fluently, and built a career standing deliberately in the middle of it — as a Business Operations and AI Systems Strategist.
            </p>
            <p className="text-white font-normal">
              That's not a title I borrowed. It's the most accurate description of what I've always naturally done.
            </p>
          </div>
        </FadeIn>

        {/* Quote */}
        <FadeIn delay={250} className="py-8">
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-serif text-transparent bg-clip-text bg-neon-gradient italic leading-tight">
              "Tools don't transform businesses. Systems do."
            </p>
          </div>
        </FadeIn>

        {/* Section — How I Think */}
        <FadeIn delay={300}>
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-8">How I Think</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-midnight/50 border border-navy p-8 rounded-[2rem] hover:border-blue/50 transition-colors space-y-4">
              <h3 className="text-2xl font-serif text-white">Systems before software.</h3>
              <p className="text-sm text-silver/90 leading-relaxed">
                I don't recommend a single tool until I understand the business. Most operations don't need more technology — they need better architecture around what they already have.
              </p>
            </div>
            <div className="bg-midnight/50 border border-navy p-8 rounded-[2rem] hover:border-purple/50 transition-colors space-y-4">
              <h3 className="text-2xl font-serif text-white">Execution over strategy.</h3>
              <p className="text-sm text-silver/90 leading-relaxed">
                A strategy document that never ships is just an expensive conversation. Every engagement I run has defined milestones, clear ownership, and outcomes you can measure.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Section — How I Work */}
        <FadeIn delay={400}>
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">How I Work</h2>
            <p>
              I lead the strategy, design the systems, and manage the execution. When a project requires specialized development or niche automation, I bring in a vetted network of experts and manage them — so you have one point of contact and one point of accountability.
            </p>
            <p>
              This isn't an agency model. It's a more effective version of hiring someone who actually controls the outcome from start to finish.
            </p>
          </div>
        </FadeIn>

        <div className="pt-8 text-center">
          <Button to="/contact" variant="primary" size="large">Work With Me</Button>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-midnight py-32 text-white text-center px-4 relative overflow-hidden rounded-t-[3rem] mx-2 border-t border-navy mt-24">
        <div className="absolute inset-0 bg-blue/5 mix-blend-overlay"></div>
        <FadeIn className="max-w-4xl mx-auto relative z-10">
          <p className="text-blue mb-6 uppercase tracking-widest text-sm font-semibold">Mission</p>
          <h2 className="text-2xl md:text-4xl font-serif leading-relaxed font-light text-silver">
            "My work is simple: help businesses close the gap between where they are operationally and where they need to be — using AI, systems design, and practical execution. Not hype. Not tools for the sake of tools. Real operational change."
          </h2>
        </FadeIn>
      </section>
    </Layout>
  );
};

export default About;
