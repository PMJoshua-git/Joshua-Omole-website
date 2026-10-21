import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/Button';
import FadeIn from '../components/FadeIn';
import { Helmet } from 'react-helmet-async';
import { useResources } from '../hooks/useResources';
import ResourceCard from '../components/knowledge-hub/ResourceCard';
import { 
  ArrowRight, 
  ArrowUpRight,
  Clock, 
  Zap, 
  Percent, 
  Settings, 
  Layers, 
  Cpu, 
  AlertCircle,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [expandedTestimonial, setExpandedTestimonial] = React.useState<number | null>(null);
  const [imageIndex, setImageIndex] = React.useState(0);
  const imageSources = [
    "/images/joshua-portrait.jpg",
    "/images/joshua-portrait.JPG",
    "/joshua-portrait.jpg",
    "/joshua-portrait.JPG",
  ];

  const handleImageError = () => {
    if (imageIndex < imageSources.length - 1) {
      setImageIndex(imageIndex + 1);
    } else {
      setImageIndex(-1); // Show fallback lettermark professional portrait
    }
  };

  const { resources, loading } = useResources();
  const latestResources = resources
    .filter(r => r.status === 'Published')
    .slice(0, 3);

  return (
    <>
      <Helmet>
        <title>Joshua Omole | Business Operations and AI Systems Strategist</title>
        <meta name="description" content="Joshua Omole helps growing businesses build operations that are easier to run and easier to scale using systems thinking, automation, and AI." />
        <meta property="og:title" content="Joshua Omole | Business Operations and AI Systems Strategist" />
        <meta property="og:description" content="I help growing businesses build operations that are easier to run and easier to scale." />
        <meta property="og:url" content="https://joshuaomole.com" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://joshuaomole.com/images/joshua-portrait.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Joshua Omole | Business Operations and AI Systems Strategist" />
        <meta name="twitter:description" content="I help growing businesses build operations that are easier to run and easier to scale." />
        <link rel="canonical" href="https://joshuaomole.com" />
      </Helmet>

      <Layout>
        {/* SECTION 1 — HERO */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pt-12 lg:pb-24 max-w-7xl mx-auto overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Text Content */}
            <div className="lg:col-span-7 relative z-10 text-left">
              <FadeIn direction="up" delay={100}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-sage-text leading-[1.1] mb-6 tracking-tight max-w-2xl text-wrap-balance">
                  I help growing businesses build operations that are easier to run and easier to scale.
                </h1>
              </FadeIn>
              <FadeIn direction="up" delay={200}>
                <p className="text-lg md:text-xl text-sage-sec leading-relaxed mb-10 max-w-xl">
                  I bring together business operations, systems thinking, technology and AI to improve how work actually gets done.
                </p>
              </FadeIn>
              <FadeIn direction="up" delay={300}>
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                  <Button to="/audit" variant="primary" size="large" className="group justify-center">
                    Book a Free Clarity Audit <ArrowUpRight className="ml-2 w-5 h-5 group-hover:rotate-45 transition-transform" />
                  </Button>
                  <Button to="/services" variant="secondary" size="large" className="justify-center">
                    See My Work
                  </Button>
                </div>
              </FadeIn>
            </div>
            
            {/* Right Visual Content */}
            <div className="lg:col-span-5 relative h-[400px] sm:h-[480px] lg:h-[540px] flex items-center justify-center">
              <FadeIn direction="up" delay={400} className="w-full h-full relative">
                <div className="absolute inset-0 z-0 rounded-[2.5rem] overflow-hidden border border-sage-border shadow-soft bg-sage-surface flex items-center justify-center">
                  {imageIndex !== -1 ? (
                    <img 
                      src={imageSources[imageIndex]} 
                      alt="Joshua Omole — Business Operations and AI Systems Strategist" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-95 hover:scale-102 transition-transform duration-700"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-sage-primary to-sage-primary-hover flex items-center justify-center">
                      <span className="text-white font-serif italic font-bold text-7xl">J.O</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-sage-bg/10 via-transparent to-transparent pointer-events-none"></div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* SECTION 2 — TESTIMONIALS (ACCORDION STYLE) */}
        <section className="py-24 bg-sage-surface-2 border-t border-b border-sage-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <FadeIn>
                <h2 className="text-3xl md:text-5xl font-serif text-sage-text mb-4">Testimonials</h2>
                <p className="text-lg text-sage-sec max-w-xl">
                  Real operational results from recent client engagements
                </p>
              </FadeIn>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 items-start">
              {[
                {
                  title: "Logistics & Resource Orchestration",
                  client: "Michael Chen, COO — AxP Logistics",
                  metric: "15 hrs/wk reclaimed",
                  problem: "Four custom logistics tools operating in completely disconnected silos, causing scheduling bottlenecks and duplicate tracking data.",
                  solution: "Mapped core workflows and designed a unified backend orchestration layer to connect their legacy systems seamlessly.",
                  outcome: "Saved their scheduling team 15 hours per week per member, while eliminating data transcription errors entirely.",
                  quote: "We had custom tools and none of them spoke to each other. Joshua saved our scheduling team 15 hours a week. He understands actual operations as deeply as the technical tools.",
                  metricIcon: <Clock className="w-4 h-4 text-sage-primary" />
                },
                {
                  title: "Client Onboarding Workflow Automation",
                  client: "Sarah Jenkins, CEO — Launch & Scale Digital Agency",
                  metric: "Under 4m onboarding",
                  problem: "Onboarding was a slow, manual process relying on spreadsheets, emails, and manual copy-pasting, creating missed handoffs.",
                  solution: "Rebuilt the entire workflow using lightweight database structures and automated handoff integrations.",
                  outcome: "Client is fully onboarded in under 4 minutes with zero manual entry or copying required.",
                  quote: "Our client onboarding was a mess. Joshua rebuilt the entire flow. Now, a client is fully onboarded in under 4 minutes with zero manual copy-pasting.",
                  metricIcon: <Zap className="w-4 h-4 text-sage-primary" />
                },
                {
                  title: "Automated Order Processing with AI",
                  client: "David Vance, Director of Operations — DVance Manufacturing",
                  metric: "-90% manual entry errors",
                  problem: "A manual order transcription pipeline led to a 12% clerical error rate, causing expensive manufacturer delays.",
                  solution: "Integrated automated order parsing utilizing custom AI pipelines feeding directly into their production database.",
                  outcome: "Cut order entry errors by 90% and freed team members to focus entirely on order delivery and quality control.",
                  quote: "Joshua gave us a production-ready system. He automated order parsing using AI, cutting entry errors by 90%.",
                  metricIcon: <Percent className="w-4 h-4 text-sage-primary" />
                }
              ].map((item, idx) => {
                const isExpanded = expandedTestimonial === idx;
                return (
                  <FadeIn key={idx} delay={idx * 100} className="h-full">
                    <div 
                      onClick={() => {
                        if (!isExpanded) {
                          setExpandedTestimonial(idx);
                        }
                      }}
                      className={`testimonial-accordion-item card-interaction bg-sage-surface rounded-xl border shadow-soft overflow-hidden flex flex-col h-full ${
                        isExpanded
                          ? 'is-expanded border-sage-primary/40 ring-1 ring-sage-primary/20 shadow-md'
                          : 'is-collapsed border-sage-border hover:border-sage-primary/40 cursor-pointer'
                      }`}
                    >
                      <div className="p-8 flex-grow flex flex-col">
                        {/* Metric badge */}
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-sage-primary uppercase mb-6 bg-sage-soft border border-sage-border/30 px-3 py-1 rounded-full self-start">
                          {item.metricIcon}
                          <span>{item.metric}</span>
                        </div>

                        {/* Default visible testimonial quote */}
                        <p className="font-serif italic text-sage-text text-base sm:text-lg leading-relaxed mb-6">
                          "{item.quote}"
                        </p>

                        {/* Author name & title with subtle arrow toggle button */}
                        <div 
                          onClick={() => setExpandedTestimonial(prev => prev === idx ? null : idx)}
                          className="flex items-center justify-between border-t border-sage-border pt-4 mt-auto cursor-pointer group/toggle select-none"
                        >
                          <div>
                            <span className="text-xs font-bold text-sage-text block group-hover/toggle:text-sage-primary transition-colors duration-200">{item.client.split(' — ')[0]}</span>
                            <span className="text-[11px] text-sage-muted block">{item.client.split(' — ')[1] || ''}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedTestimonial(prev => prev === idx ? null : idx);
                            }}
                            className={`p-2 rounded-full transition-all duration-300 ease-out cursor-pointer active:scale-95 ${
                              isExpanded
                                ? 'bg-sage-primary text-white shadow-xs'
                                : 'bg-sage-surface-2 text-sage-muted group-hover/toggle:text-sage-text group-hover/toggle:bg-sage-soft'
                            }`}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? "Collapse case details" : "Expand case details"}
                          >
                            <ChevronDown 
                              className={`w-4 h-4 transition-transform duration-300 ease-out will-change-transform ${
                                isExpanded ? 'rotate-180' : 'rotate-0'
                              }`} 
                            />
                          </button>
                        </div>

                        {/* Accordion Expanded Details with smooth grid height transition */}
                        <div
                          className={`grid transition-[grid-template-rows,opacity] duration-250 ease-out ${
                            isExpanded ? 'grid-rows-[1fr] opacity-100 mt-5 pt-5 border-t border-sage-border/60' : 'grid-rows-[0fr] opacity-0'
                          }`}
                        >
                          <div className="overflow-hidden space-y-4 text-xs sm:text-sm">
                            <div className="bg-sage-surface-2/60 p-3.5 rounded-lg border border-sage-border/40">
                              <span className="text-[10px] font-bold text-sage-primary uppercase tracking-widest block mb-0.5">Project Scope</span>
                              <h4 className="font-heading font-semibold text-sage-text text-sm">{item.title}</h4>
                            </div>
                            <div>
                              <span className="font-semibold text-sage-text block text-[11px] uppercase tracking-wider mb-1">Problem</span>
                              <p className="text-sage-sec leading-relaxed">{item.problem}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-sage-text block text-[11px] uppercase tracking-wider mb-1">What I Did</span>
                              <p className="text-sage-sec leading-relaxed">{item.solution}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-sage-text block text-[11px] uppercase tracking-wider mb-1">Outcome</span>
                              <p className="text-sage-primary font-medium leading-relaxed">{item.outcome}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Button to="/services" variant="outline" size="large">
                See How I Work <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION 3 — PROBLEM RECOGNITION */}
        <section className="py-24 bg-sage-surface-2 border-t border-b border-sage-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-16">
              <FadeIn>
                <h2 className="text-3xl md:text-4.5xl font-serif text-sage-text leading-[1.15] mb-6 tracking-tight text-wrap-balance">
                  Growth changes the way a business works.
                </h2>
                <p className="text-lg md:text-xl text-sage-sec leading-relaxed">
                  As a business grows, processes that once worked informally can begin creating friction. Systems that were simple at launch become bottlenecks as you try to scale.
                </p>
              </FadeIn>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Too much manual work",
                  description: "Your team is spending hours copy-pasting data, compiling reports, and repeating basic administrative tasks that should be automated."
                },
                {
                  title: "Disconnected tools",
                  description: "You have great software platforms, but they operate in complete silos. Information gets lost in the gaps, leading to human errors."
                },
                {
                  title: "Unclear ownership",
                  description: "As operations expand, handoffs between team members begin to break down, and critical tasks quietly fall through the cracks."
                },
                {
                  title: "Slow decision-making",
                  description: "Crucial operational and client data is buried in scattered sheets and separate systems, making it hard to get a single source of truth."
                },
                {
                  title: "Operational bottlenecks",
                  description: "Scaling stalls not because you lack sales, but because your delivery capacity and internal support are stretched to their limits."
                }
              ].map((problem, idx) => (
                <FadeIn key={idx} delay={idx * 100} className="h-full">
                  <div className="bg-sage-surface p-8 rounded-xl border border-sage-border shadow-soft h-full hover:border-sage-primary/30 transition-all duration-300">
                    <div className="w-8 h-8 rounded-full bg-sage-soft flex items-center justify-center text-sage-primary text-sm font-semibold mb-6">
                      0{idx + 1}
                    </div>
                    <h3 className="text-lg font-semibold text-sage-text mb-3 font-serif">{problem.title}</h3>
                    <p className="text-sage-sec text-sm leading-relaxed">{problem.description}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4 — HOW JOSHUA HELPS */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <FadeIn>
              <h2 className="text-3xl md:text-5xl font-serif text-sage-text mb-6">How I help</h2>
              <p className="text-lg text-sage-sec max-w-xl mx-auto">
                No complex theories. I focus on three practical operational pillars to streamline your day-to-day work.
              </p>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <FadeIn delay={0} className="h-full">
              <div className="bg-sage-surface p-10 rounded-xl border border-sage-border shadow-soft h-full flex flex-col hover:border-sage-primary/30 transition-all duration-300">
                <div className="w-12 h-12 bg-sage-soft rounded-lg flex items-center justify-center mb-6 text-sage-primary border border-sage-border/30">
                  <Settings className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-sage-text mb-4">Operations & Systems</h3>
                <p className="text-sage-sec text-sm leading-relaxed mb-8 flex-grow">
                  I map and understand your workflows, pinpoint underlying bottlenecks, and redesign how work moves through your business to optimize resources.
                </p>
                <Button to="/services" variant="text" className="justify-start inline-flex items-center text-sm font-semibold gap-1 hover:gap-2 transition-all">
                  Learn more <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </FadeIn>

            <FadeIn delay={100} className="h-full">
              <div className="bg-sage-surface p-10 rounded-xl border border-sage-border shadow-soft h-full flex flex-col hover:border-sage-primary/30 transition-all duration-300">
                <div className="w-12 h-12 bg-sage-soft rounded-lg flex items-center justify-center mb-6 text-sage-primary border border-sage-border/30">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-sage-text mb-4">Technology & Project Oversight</h3>
                <p className="text-sage-sec text-sm leading-relaxed mb-8 flex-grow">
                  I translate business operational requirements into coordinated technical execution, bridging the gap between people, processes, and technical specialists.
                </p>
                <Button to="/services" variant="text" className="justify-start inline-flex items-center text-sm font-semibold gap-1 hover:gap-2 transition-all">
                  Learn more <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </FadeIn>

            <FadeIn delay={200} className="h-full">
              <div className="bg-sage-surface p-10 rounded-xl border border-sage-border shadow-soft h-full flex flex-col hover:border-sage-primary/30 transition-all duration-300">
                <div className="w-12 h-12 bg-sage-soft rounded-lg flex items-center justify-center mb-6 text-sage-primary border border-sage-border/30">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-sage-text mb-4">AI & Automation</h3>
                <p className="text-sage-sec text-sm leading-relaxed mb-8 flex-grow">
                  I introduce AI and modern automation tools only where they genuinely improve efficiency, speed up information flow, and boost decision-making.
                </p>
                <Button to="/services" variant="text" className="justify-start inline-flex items-center text-sm font-semibold gap-1 hover:gap-2 transition-all">
                  Learn more <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </FadeIn>
          </div>
        </section>



        {/* SECTION 5 — APPROACH / BRIDGE */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <FadeIn>
              <h2 className="text-3xl md:text-5xl font-serif text-sage-text mb-6">
                A better system starts before the technology.
              </h2>
              <p className="text-lg text-sage-sec leading-relaxed">
                Most technical implementation projects fail not because of the software, but because the underlying business processes and ownership were never clarified first. I use the **BRIDGE** framework to ensure alignment.
              </p>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                letter: "B",
                name: "Baseline",
                desc: "Understand how the business operates today. Mapped workflows before writing code or choosing software."
              },
              {
                letter: "R",
                name: "Roles",
                desc: "Clarify ownership and responsibilities. Ensure everyone knows exactly what they own in the workflow."
              },
              {
                letter: "I",
                name: "Integrate",
                desc: "Connect people, processes, and technology. Build cohesive pipelines that talk to each other seamlessly."
              },
              {
                letter: "D",
                name: "Deploy",
                desc: "Implement the solution. Live setup backed with extensive staff testing and thorough training handoffs."
              },
              {
                letter: "G",
                name: "Governance",
                desc: "Make sure the system keeps working. Define protocols to prevent operational drift as you scale."
              }
            ].map((step, idx) => (
              <FadeIn key={idx} delay={idx * 100} className="h-full">
                <div className="bg-sage-surface p-8 rounded-xl border border-sage-border shadow-soft h-full flex flex-col hover:border-sage-primary/30 transition-all duration-300">
                  <div className="text-4xl font-bold font-serif text-sage-primary mb-3">
                    {step.letter}
                  </div>
                  <h3 className="text-lg font-serif font-bold text-sage-text mb-2">{step.name}</h3>
                  <p className="text-sage-sec text-xs leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* SECTION 6 — ABOUT JOSHUA */}
        <section className="py-24 bg-sage-surface-2 border-t border-b border-sage-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Left Column Portrait */}
              <div className="lg:col-span-5 relative h-[380px] sm:h-[460px] lg:h-[500px] flex items-center justify-center">
                <FadeIn direction="left" className="w-full h-full relative">
                  <div className="absolute inset-0 z-0 rounded-[2.5rem] overflow-hidden border border-sage-border shadow-soft bg-sage-surface flex items-center justify-center">
                    {imageIndex !== -1 ? (
                      <img 
                        src={imageSources[imageIndex]} 
                        alt="Joshua Omole — Business Operations and AI Systems Strategist" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-95 hover:scale-102 transition-transform duration-700"
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

              {/* Right Column Bio */}
              <div className="lg:col-span-7 relative z-10 text-left">
                <FadeIn direction="up">
                  <h2 className="text-3xl md:text-5xl font-serif text-sage-text leading-tight mb-6">
                    I'm Joshua Omole.
                  </h2>
                  <p className="text-lg font-medium text-sage-primary font-serif italic mb-6">
                    \"The more I worked with technology, the more I realised that many technical problems begin as operational problems.\"
                  </p>
                  <div className="text-sage-sec space-y-4 text-sm leading-relaxed mb-8 max-w-xl">
                    <p>
                      I help small and mid-sized businesses design smarter operations using practical technology, systems thinking, and execution oversight. I translate complex business bottlenecks into coordinated technical blueprints.
                    </p>
                    <p>
                      Rather than pushing specific software, my priority is designing workflows that actually resolve friction and are easily adopted by your team. Whether you need automated pipelines, process redesign, or strategic AI systems oversight, I serve as your direct engineering partner.
                    </p>
                  </div>
                  <Button to="/about" variant="secondary" size="large">
                    About Joshua <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </FadeIn>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7 — INSIGHTS */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div>
              <FadeIn>
                <h2 className="text-3xl md:text-5xl font-serif text-sage-text mb-4">
                  Insights
                </h2>
                <p className="text-lg text-sage-sec max-w-xl">
                  Ideas on business operations, AI, technology, and execution.
                </p>
              </FadeIn>
            </div>
            <FadeIn>
              <Button to="/knowledge-hub" variant="outline" size="large">
                Explore Insights <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </FadeIn>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-sage-surface border border-sage-border rounded-xl h-80"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestResources.map((resource) => (
                <FadeIn key={resource.id} className="h-full">
                  <ResourceCard 
                    resource={resource} 
                    onReadMore={() => navigate('/knowledge-hub')} 
                  />
                </FadeIn>
              ))}
              {latestResources.length === 0 && (
                <div className="col-span-3 text-center py-12 bg-sage-surface rounded-xl border border-sage-border">
                  <AlertCircle className="w-12 h-12 text-sage-primary/50 mx-auto mb-3" />
                  <p className="text-sage-muted text-sm">No resources published yet. Check back soon!</p>
                </div>
              )}
            </div>
          )}

          {/* Micro Newsletter Sign-up */}
          <FadeIn>
            <div className="mt-16 bg-sage-surface border border-sage-border p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto shadow-soft">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-sage-soft flex items-center justify-center text-sage-primary shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-sage-text">Join the Operations Newsletter</h3>
                  <p className="text-xs text-sage-sec mt-1">Want essays on scaling systems and technology? No spam, unsubscribe anytime.</p>
                </div>
              </div>
              <Button to="/newsletter" variant="primary" size="small" className="whitespace-nowrap w-full md:w-auto">
                Subscribe to Essays
              </Button>
            </div>
          </FadeIn>
        </section>

        {/* SECTION 8 — FINAL CTA */}
        <section className="py-24 bg-sage-primary text-center px-4 rounded-3xl mx-4 mb-20 text-white shadow-medium relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-sage-primary to-sage-primary-hover opacity-50 pointer-events-none"></div>
          <FadeIn direction="up" className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif text-white mb-6 text-wrap-balance">
              Something in your operation isn't working as well as it should?
            </h2>
            <p className="text-sage-soft opacity-90 mb-10 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Start with a free 30-minute Clarity Audit. We'll identify where the friction is, what needs attention and where technology or AI may actually help.
            </p>
            <Button to="/audit" size="large" className="bg-sage-surface text-sage-primary md:hover:bg-sage-soft hover:scale-102 shadow-sm">
              Book the Free Audit
            </Button>
          </FadeIn>
        </section>
      </Layout>
    </>
  );
};

export default Home;
