import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Quote, Clock, Percent, Zap, TrendingUp } from 'lucide-react';
import FadeIn from './FadeIn';

interface Testimonial {
    id: number;
    quote: string;
    author: string;
    role: string;
    company: string;
    metric: string;
    metricLabel: string;
    metricIcon: React.ReactNode;
    tags: string[];
}

const TestimonialCarousel: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAutoplay, setIsAutoplay] = useState(true);
    const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

    const testimonials: Testimonial[] = [
        {
            id: 1,
            quote: "We had four custom tools and none of them spoke to each other. Joshua mapped our bottlenecks, designed a unified backend orchestration layer, and saved our scheduling team 15 hours a week. He understands the actual operations as deeply as the technical tools.",
            author: "Michael Chen",
            role: "Chief Operating Officer",
            company: "AxP Logistics",
            metric: "15 hrs/wk",
            metricLabel: "Time Reclaimed per Team Member",
            metricIcon: <Clock className="w-5 h-5 text-blue" />,
            tags: ["Operations Orchestration", "Logistics", "Workflow Automation"]
        },
        {
            id: 2,
            quote: "Our client onboarding was a mess of spreadsheets, emails, and missed handoffs. Joshua rebuilt the entire flow using smart automations and lightweight database structures. Now, a client is fully onboarded in under 4 minutes with zero manual copy-pasting.",
            author: "Sarah Jenkins",
            role: "Founder & CEO",
            company: "Launch & Scale Digital Agency",
            metric: "Under 4m",
            metricLabel: "Client Onboarding Speed",
            metricIcon: <Zap className="w-5 h-5 text-purple" />,
            tags: ["Client Onboarding", "HubSpot Integration", "Database Design"]
        },
        {
            id: 3,
            quote: "Most consultants just give you slides. Joshua gave us a production-ready system. He integrated automated order parsing using custom AI pipelines, cutting down our manual entry errors by 90% and freeing our team to focus on delivery.",
            author: "David Vance",
            role: "Director of Operations",
            company: "DVance Manufacturing",
            metric: "-90%",
            metricLabel: "Manual Entry Errors",
            metricIcon: <Percent className="w-5 h-5 text-emerald-400" />,
            tags: ["AI Order Parsing", "System Integration", "Quality Control"]
        },
        {
            id: 4,
            quote: "Joshua didn't start with tools; he started with our team's day-to-day pain points. He restructured our technical debt and built a clean operational roadmap. It's rare to find an integrator who carries strategy all the way to complete team adoption.",
            author: "Elena Rostova",
            role: "Managing Partner",
            company: "Advance Consulting",
            metric: "100%",
            metricLabel: "Staff Adoption Rate",
            metricIcon: <TrendingUp className="w-5 h-5 text-blue" />,
            tags: ["Technical Debt Audit", "Operational Roadmap", "Change Management"]
        }
    ];

    const startAutoplay = () => {
        stopAutoplay();
        if (isAutoplay) {
            autoplayTimerRef.current = setInterval(() => {
                setActiveIndex((prev) => (prev + 1) % testimonials.length);
            }, 8000);
        }
    };

    const stopAutoplay = () => {
        if (autoplayTimerRef.current) {
            clearInterval(autoplayTimerRef.current);
            autoplayTimerRef.current = null;
        }
    };

    useEffect(() => {
        startAutoplay();
        return () => stopAutoplay();
    }, [isAutoplay, activeIndex]);

    const handlePrev = () => {
        stopAutoplay();
        setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const handleNext = () => {
        stopAutoplay();
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
    };

    const handleDotClick = (index: number) => {
        stopAutoplay();
        setActiveIndex(index);
    };

    const currentTestimonial = testimonials[activeIndex];

    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10" id="testimonials">
            <div className="text-center mb-16">
                <FadeIn>
                    <div className="inline-block text-blue font-mono text-sm tracking-widest uppercase mb-4 px-3 py-1 rounded-full bg-blue/10 border border-blue/30">
                        {`{ REAL OUTCOMES }`}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">
                        Success Stories in Action
                    </h2>
                    <p className="text-silver max-w-2xl mx-auto text-lg leading-relaxed">
                        Measurable operational improvements built for growing businesses. No slides, no vanity metrics.
                    </p>
                </FadeIn>
            </div>

            <div className="max-w-5xl mx-auto">
                <FadeIn className="relative">
                    {/* Carousel Container */}
                    <div 
                        className="bg-midnight/40 border border-navy rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden shadow-glow transition-all duration-300 hover:border-blue/30"
                        onMouseEnter={stopAutoplay}
                        onMouseLeave={startAutoplay}
                    >
                        {/* Background subtle gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue/5 via-transparent to-purple/5 pointer-events-none" />

                        {/* Visual grid layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center relative z-10">
                            
                            {/* Quote Content Section (Left) */}
                            <div className="lg:col-span-8 flex flex-col justify-between h-full">
                                <div className="mb-6">
                                    <div className="w-12 h-12 rounded-full bg-blue/10 flex items-center justify-center mb-6">
                                        <Quote className="w-6 h-6 text-blue" />
                                    </div>
                                    <blockquote className="text-xl md:text-2xl font-serif text-white leading-relaxed italic mb-8">
                                        "{currentTestimonial.quote}"
                                    </blockquote>
                                </div>

                                <div className="border-t border-navy/80 pt-6">
                                    <h4 className="text-lg font-bold text-white mb-1">
                                        {currentTestimonial.author}
                                    </h4>
                                    <p className="text-silver text-sm">
                                        {currentTestimonial.role} &mdash;{' '}
                                        <span className="text-blue">{currentTestimonial.company}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Stat Badge Section (Right) */}
                            <div className="lg:col-span-4 flex flex-col items-center justify-center bg-obsidian/60 border border-navy/80 rounded-3xl p-8 text-center min-h-[220px]">
                                <div className="w-12 h-12 rounded-full bg-navy/60 flex items-center justify-center mb-4 border border-blue/20">
                                    {currentTestimonial.metricIcon}
                                </div>
                                <h3 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2 tracking-tight">
                                    {currentTestimonial.metric}
                                </h3>
                                <p className="text-silver text-xs uppercase tracking-widest leading-relaxed max-w-[180px]">
                                    {currentTestimonial.metricLabel}
                                </p>
                                
                                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                    {currentTestimonial.tags.slice(0, 2).map((tag, idx) => (
                                        <span 
                                            key={idx} 
                                            className="text-[10px] font-mono text-silver/80 bg-navy/40 px-2.5 py-1 rounded-full border border-navy"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Desktop Side Navigation Buttons */}
                        <div className="absolute right-6 bottom-6 flex items-center gap-2 md:gap-3 z-20">
                            <button
                                onClick={handlePrev}
                                className="w-10 h-10 rounded-full border border-navy bg-obsidian/80 flex items-center justify-center text-silver hover:text-white hover:border-blue/50 hover:bg-navy/40 transition-all cursor-pointer"
                                aria-label="Previous Testimonial"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleNext}
                                className="w-10 h-10 rounded-full border border-navy bg-obsidian/80 flex items-center justify-center text-silver hover:text-white hover:border-blue/50 hover:bg-navy/40 transition-all cursor-pointer"
                                aria-label="Next Testimonial"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Indicator Dots & Autoplay Pause status */}
                    <div className="flex justify-center items-center gap-3 mt-8">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => handleDotClick(index)}
                                className={`h-2 transition-all duration-300 rounded-full cursor-pointer ${
                                    index === activeIndex ? 'w-8 bg-blue' : 'w-2 bg-navy hover:bg-silver/30'
                                }`}
                                aria-label={`Go to testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

export default TestimonialCarousel;
