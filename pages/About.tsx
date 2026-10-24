import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import FadeIn from '../components/FadeIn';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowRight, 
  ArrowUpRight, 
  CheckCircle2, 
  Settings, 
  Layers, 
  Cpu, 
  Users, 
  HelpCircle, 
  Award, 
  BookOpen,
  Check
} from 'lucide-react';

const About: React.FC = () => {
  const [imageIndex, setImageIndex] = useState(0);
  const imageSources = [
    "/images/joshua-portrait.png",
    "/joshua-portrait.png",
    "/images/joshua-portrait.jpg",
    "/images/joshua-portrait.jpeg",
    "/images/joshua-portrait.webp",
    "/images/joshua-portrait.PNG",
    "/images/joshua-portrait.JPG",
    "/joshua-portrait.jpg",
    "/joshua-portrait.jpeg",
    "/joshua-portrait.webp",
    "/joshua-portrait.PNG",
    "/joshua-portrait.JPG",
  ];

  const handleImageError = () => {
    if (imageIndex < imageSources.length - 1) {
      setImageIndex(imageIndex + 1);
    } else {
      setImageIndex(-1); // Letters lettermark fallback
    }
  };

  return (
    <>
      <Helmet>
        <title>About | Joshua Omole | Business Operations & AI Systems Strategist</title>
        <meta name="description" content="Meet Joshua Omole, the bridge between business strategy and technical execution. Learn how systems thinking, operational design, and practical execution transform scaling businesses." />
        <meta property="og:title" content="About | Joshua Omole | Business Operations & AI Systems Strategist" />
        <meta property="og:description" content="Learn how systems thinking, operational design, and practical execution transform scaling businesses." />
        <link rel="canonical" href="https://joshuaomole.com/about" />
      </Helmet>

      <Layout>
        
        {/* SECTION 1 — MEET JOSHUA */}
        <section className="bg-sage-bg border-b border-sage-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-24">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              
              {/* Text column (60%) */}
              <div className="flex-grow lg:w-3/5 text-center lg:text-left">
                <FadeIn direction="up">
                  <span className="font-heading text-xs font-semibold tracking-[0.12em] uppercase text-sage-primary block mb-4">
                    Perspective
                  </span>
                  
                  <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-sage-text leading-tight mb-6 tracking-tight">
                    I'm Joshua Omole.
                  </h1>

                  <div className="space-y-6 font-body text-base sm:text-lg text-sage-text/80 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    <p>
                      I work with business owners to design operations that run cleanly, save time and money, and increase efficiency.
                    </p>
                    <p>
                      I stand at the intersection of business strategy, systems thinking, technology, and AI, not to make your business more complicated, but to make it simpler and easier to manage.
                    </p>
                    <p>
                      Rather than selling individual packages or pushing trendy software platforms, I focus on the flow of your work.
                    </p>
                    <p>
                      I map workflows, identify where operational leverage is hidden, and build structural solutions that align your staff, process, and tools into one unified engine.
                    </p>
                  </div>
                </FadeIn>
              </div>

              {/* Image column (40%) */}
              <div className="w-full max-w-[300px] sm:max-w-[360px] lg:w-[380px] lg:max-w-none flex-shrink-0">
                <FadeIn direction="right" delay={200}>
                  <div className="rounded-[2rem] overflow-hidden border border-sage-border shadow-soft bg-sage-surface aspect-[4/5] sm:aspect-[3/4] flex items-center justify-center">
                    {imageIndex !== -1 ? (
                      <img
                        src={imageSources[imageIndex]}
                        alt="Joshua Omole — Business Operations & AI Systems Strategist"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top opacity-95 hover:scale-102 transition-transform duration-500"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-sage-primary to-sage-primary-hover flex items-center justify-center">
                        <span className="text-white font-serif italic font-bold text-6xl">J.O</span>
                      </div>
                    )}
                  </div>
                </FadeIn>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 4 — THE JOURNEY */}
        <section className="bg-sage-surface border-b border-sage-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-24">
            <div className="max-w-5xl mx-auto">
              <FadeIn>
                <div className="text-center mb-12">
                  <span className="font-heading text-xs font-semibold tracking-[0.12em] uppercase text-sage-primary block mb-4">
                    Evolution of Perspective
                  </span>
                  <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-sage-text leading-snug tracking-tight">
                    "Technology was where I started. The business problem kept leading me somewhere else."
                  </h2>
                </div>

                <div className="relative border-l border-sage-border ml-4 md:ml-6 space-y-12">
                  {[
                    {
                      phase: "Technology & Execution Start",
                      desc: "I started in IT Project Management. Working closely with core technology taught me what was technical and possible—but it also taught me that delivering a technical output doesn't automatically equal a business outcome."
                    },
                    {
                      phase: "Finding the Hidden Bottlenecks",
                      desc: "As I deployed software solutions, I realized that most 'technical deployment failures' were actually human and operational failures. They were caused by poorly designed workflows, unclear ownership, disconnected tools, and zero staff adoption."
                    },
                    {
                      phase: "Designing Clear Systems",
                      desc: "Today, I sit deliberately between business strategy and engineering execution. I solve the foundational operational problems before writing code or suggesting tools, ensuring that whatever technology we integrate serves a clear, predefined workflow."
                    }
                  ].map((step, idx) => (
                    <div key={idx} className="relative pl-8 sm:pl-10">
                      <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border border-sage-border bg-sage-surface flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-sage-primary"></div>
                      </div>
                      <h3 className="font-heading text-lg font-semibold text-sage-text mb-2">{step.phase}</h3>
                      <p className="font-body text-sm sm:text-base text-sage-muted leading-relaxed">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* SECTION 5 — THE WAY I THINK */}
        <section className="bg-sage-bg border-b border-sage-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-24">
            
            <div className="mb-12">
              <FadeIn>
                <span className="font-heading text-xs font-semibold tracking-[0.12em] uppercase text-sage-primary block mb-4">
                  First Principles
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-sage-text leading-snug tracking-tight">
                  The Way I Think
                </h2>
              </FadeIn>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "AI doesn't fix broken operations.",
                  desc: "Automating an inefficient process only makes it break faster, at a larger scale. We fix the operational sequence first, then bring in automation."
                },
                {
                  title: "Software is not scaling.",
                  desc: "Adding more SaaS tools increases operational overhead and creates silos. A business scales when it simplifies its systems and tightens its data flow."
                },
                {
                  title: "Reduce dependence on heroics.",
                  desc: "A business shouldn't rely on team members working twice as hard to catch missed handoffs. The system should make predictable execution the default."
                },
                {
                  title: "Simplicity beats complexity.",
                  desc: "The best systems are the ones your team actually uses. I build lightweight, resilient operational flows with minimal technical debt."
                },
                {
                  title: "Tech must serve the business.",
                  desc: "We never integrate a tool simply because it is new or popular. Every tool must earn its place by proving it saves time, reduces errors, or opens bottlenecks."
                }
              ].map((principle, idx) => (
                <FadeIn key={idx} delay={idx * 100} className="h-full">
                  <div className="bg-sage-surface p-8 rounded-xl border border-sage-border h-full shadow-soft flex flex-col justify-between hover:border-sage-primary/30 transition-all duration-300">
                    <div>
                      <h3 className="font-heading text-base sm:text-lg font-semibold text-sage-text mb-3">
                        {principle.title}
                      </h3>
                      <p className="font-body text-xs sm:text-sm text-sage-muted leading-relaxed">
                        {principle.desc}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>

          </div>
        </section>

        {/* SECTION 6 — WHAT THIS MEANS FOR YOUR BUSINESS */}
        <section className="bg-sage-surface border-b border-sage-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-24">
            
            <div className="mb-12">
              <FadeIn>
                <span className="font-heading text-xs font-semibold tracking-[0.12em] uppercase text-sage-primary block mb-4">
                  Business Value
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-sage-text leading-snug tracking-tight max-w-xl">
                  So what does that mean for the businesses I work with?
                </h2>
              </FadeIn>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              
              {/* Before Column */}
              <FadeIn className="h-full bg-sage-surface-2 p-8 rounded-2xl border border-sage-border">
                <span className="text-xs font-bold tracking-wider text-sage-muted uppercase block mb-6">Typical State Before Engagement</span>
                <ul className="space-y-4">
                  {[
                    "Manual work consuming valuable team hours.",
                    "Unclear process handoffs and task leaks.",
                    "Disconnected tools running in absolute silos.",
                    "Constant operational firefighting by leadership.",
                    "Founder dependency holding back real scale."
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">&times;</span>
                      <span className="font-body text-sm text-sage-sec leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* After Column */}
              <FadeIn className="h-full bg-sage-soft p-8 rounded-2xl border border-sage-primary/20 shadow-soft">
                <span className="text-xs font-bold tracking-wider text-sage-primary uppercase block mb-6">Target State After System Design</span>
                <ul className="space-y-4">
                  {[
                    "Clear, designed workflows that require less manual entry.",
                    "Defined ownership where everyone knows their responsibilities.",
                    "Cohesive, connected systems mapping single sources of truth.",
                    "Predictable execution letting your team focus on core delivery.",
                    "Scalable operations that run smoothly without founder hand-holding."
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-sage-primary/10 text-sage-primary flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"><Check className="w-3 h-3" /></span>
                      <span className="font-body text-sm text-sage-text font-medium leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

            </div>
          </div>
        </section>

        {/* SECTION 7 — HOW I WORK */}
        <section className="bg-sage-surface-2 border-b border-sage-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-24">
            
            <div className="mb-12">
              <FadeIn>
                <span className="font-heading text-xs font-semibold tracking-[0.12em] uppercase text-sage-primary block mb-4">
                  Working Philosophy
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-sage-text leading-snug tracking-tight">
                  How I work
                </h2>
              </FadeIn>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[
                { step: "01", name: "Understand before changing", desc: "No recommendations are made until I deeply observe your day-to-day workflow." },
                { step: "02", name: "Simplify before automating", desc: "We eliminate redundant sequences first so we never automate wasted effort." },
                { step: "03", name: "Design for people first", desc: "Software only works if your team adopts it. We design controls for human comfort." },
                { step: "04", name: "Stay close to execution", desc: "I handle the implementation details, oversight, and configuration—not just slides." },
                { step: "05", name: "Improve continuously", desc: "Systems are structured with governance rules so they evolve cleanly as you scale." }
              ].map((item, idx) => (
                <FadeIn key={idx} delay={idx * 100} className="h-full">
                  <div className="bg-sage-surface p-6 rounded-xl border border-sage-border h-full shadow-soft flex flex-col justify-between hover:border-sage-primary/20 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-sage-primary/30 font-mono block mb-3">{item.step}</span>
                      <h3 className="font-heading text-sm sm:text-base font-semibold text-sage-text mb-2">{item.name}</h3>
                      <p className="font-body text-xs text-sage-muted leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 8 — WHAT I ACTUALLY HELP WITH */}
        <section className="bg-sage-bg border-b border-sage-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <FadeIn>
                <span className="font-heading text-xs font-semibold tracking-[0.12em] uppercase text-sage-primary block mb-4">
                  Areas of Focus
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-sage-text mb-6">
                  Where my work usually begins
                </h2>
                <div className="flex flex-wrap justify-center gap-3 mb-10">
                  {[
                    "Operational Clarity Mapping",
                    "Systems & Workflow Design",
                    "Technology & Project Oversight",
                    "AI & Modern Automation Pipelines",
                    "Staff Adoption & Continuous Governance"
                  ].map((tag, i) => (
                    <span key={i} className="text-xs font-medium text-sage-text bg-sage-surface border border-sage-border px-4 py-2 rounded-full shadow-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link to="/services" className="inline-flex items-center text-sm font-semibold text-sage-primary hover:text-sage-primary-hover gap-1 hover:gap-2 transition-all">
                  Explore how I can help <ArrowRight className="w-4 h-4" />
                </Link>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* SECTION 9 — WHO I WORK BEST WITH */}
        <section className="bg-sage-surface border-b border-sage-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-24">
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <span className="font-heading text-xs font-semibold tracking-[0.12em] uppercase text-sage-primary block mb-4">
                  Alignment
                </span>
                
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-sage-text leading-snug mb-8 tracking-tight">
                  Who I can help most
                </h2>

                <div className="space-y-4 font-body text-base text-sage-sec leading-relaxed">
                  <p>
                    I am particularly useful for **founder-led businesses** and **growing companies** where increasing operational complexity is starting to create drag.
                  </p>
                  <p>
                    If your team is struggling to manage daily processes, or if you are considering introducing AI and automation but want to make sure it drives measurable outcomes rather than creating confusion, my systematic bridging approach is designed for you.
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* SECTION 10 — CREDIBILITY */}
        <section className="bg-sage-bg border-b border-sage-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-24">
            
            <div className="mb-12">
              <FadeIn>
                <span className="font-heading text-xs font-semibold tracking-[0.12em] uppercase text-sage-primary block mb-4">
                  Background
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-sage-text leading-snug tracking-tight">
                  Why I bring this perspective
                </h2>
              </FadeIn>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "IT Project Management", desc: "Years coordinating complex technical systems deployment, ensuring milestones were hit on time and within scope." },
                { title: "Business Operations", desc: "Analyzing high-level business models and translating theoretical strategic roadmaps into daily practical execution." },
                { title: "AI & Systems Integration", desc: "Building actual working pipelines using modern API layers, automation engines, and lightweight database frameworks." }
              ].map((item, idx) => (
                <FadeIn key={idx} delay={idx * 150} className="h-full">
                  <div className="bg-sage-surface p-8 rounded-xl border border-sage-border h-full shadow-soft hover:border-sage-primary/30 transition-all duration-300">
                    <h3 className="font-heading text-base sm:text-lg font-semibold text-sage-text mb-3">{item.title}</h3>
                    <p className="font-body text-xs sm:text-sm text-sage-muted leading-relaxed">{item.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 11 — BEYOND TECHNOLOGY */}
        <section className="bg-sage-surface border-b border-sage-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-24">
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <span className="font-heading text-xs font-semibold tracking-[0.12em] uppercase text-sage-primary block mb-4">
                  Systems Integration
                </span>
                
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-sage-text leading-snug mb-6 tracking-tight">
                  Technology is only part of the system.
                </h2>

                <div className="space-y-4 font-body text-base text-sage-sec leading-relaxed">
                  <p>
                    A fully optimized business relies equally on leadership alignment, clean communication, rapid decision-making, clear ownership, and team behavior.
                  </p>
                  <p className="font-semibold text-sage-primary">
                    AI and modern automation are powerful tools inside an operating system—they are not the operating system itself.
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* SECTION 12 — FINAL PERSONAL STATEMENT */}
        <section className="bg-sage-surface-2 border-b border-sage-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <FadeIn>
                <p className="font-body text-lg sm:text-xl lg:text-2xl text-sage-text leading-relaxed font-serif italic mb-6">
                  "Businesses don't become exceptional because they adopt more technology. They become exceptional when great people, clear processes, and useful technology work together."
                </p>
                <span className="text-xs font-bold tracking-wider text-sage-primary uppercase">
                  That's the kind of work I care about.
                </span>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* SECTION 13 — CTA */}
        <section className="bg-sage-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-sage-primary to-sage-primary-hover opacity-50 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20 relative z-10 text-center lg:text-left">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              
              <div>
                <FadeIn>
                  <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-white mb-2">
                    Let's start with the problem.
                  </h2>
                  <p className="font-body text-sm text-white/70 max-w-lg">
                    If something in your operation isn't working as well as it should, let's look at the baseline with a free 30-minute Systems Clarity Audit.
                  </p>
                </FadeIn>
              </div>

              <FadeIn delay={100} className="w-full sm:w-auto flex-shrink-0 flex flex-col sm:flex-row items-center gap-4 justify-center">
                <Link
                  to="/audit"
                  className="w-full sm:w-auto text-center bg-sage-surface text-sage-primary font-body text-sm font-medium px-7 py-3.5 rounded-lg hover:bg-sage-soft transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                >
                  Book a Free Clarity Audit
                </Link>
                <Link
                  to="/services"
                  className="w-full sm:w-auto text-center text-white border border-white/30 hover:bg-white/10 font-body text-sm font-medium px-7 py-3.5 rounded-lg transition-all"
                >
                  See how I work &rarr;
                </Link>
              </FadeIn>

            </div>
          </div>
        </section>

      </Layout>
    </>
  );
};

export default About;
