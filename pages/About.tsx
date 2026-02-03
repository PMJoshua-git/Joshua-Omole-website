import React from 'react';
import Layout from '../components/Layout';
import QuoteBlock from '../components/QuoteBlock';
import Button from '../components/Button';
import FadeIn from '../components/FadeIn';

const About: React.FC = () => {
  return (
    <Layout>
      <section className="py-24 px-4 md:py-32 bg-midnight/30 rounded-b-[3rem] border-b border-navy">
        <FadeIn className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-8 leading-[1.1]">The Bridge Between Strategy & Execution</h1>
          <p className="text-xl md:text-2xl text-silver max-w-2xl mx-auto font-light leading-relaxed">
            I don't just talk about AI. I build the systems that make it useful for business.
          </p>
        </FadeIn>
      </section>

      <section className="py-24 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="prose prose-lg prose-headings:font-serif text-silver mx-auto prose-strong:text-white">
            <FadeIn delay={100}>
                <div className="bg-midnight p-10 rounded-[2rem] shadow-glow border border-navy mb-12">
                    <h3 className="text-3xl font-serif text-white mb-6">Beyond the Hype</h3>
                    <p className="mb-6 leading-relaxed">
                        The market is flooded with "AI Experts" who sell prompts and chatbots. That is not what I do.
                        I operate at the intersection of <strong className="text-blue">Business Strategy</strong>, <strong className="text-purple">Technical Architecture</strong>, and <strong className="text-white">Project Management</strong>.
                    </p>
                    <p className="leading-relaxed">
                        My role is to act as a bridge. I translate the complex capabilities of modern AI into specific, measurable business workflows that your team can actually use. I protect you from scope creep, vendor mismatch, and the "shiny object syndrome" that kills digital transformation projects.
                    </p>
                </div>
            </FadeIn>

            <FadeIn delay={200} className="my-20">
                 <div className="text-center">
                    <p className="text-4xl md:text-5xl font-serif text-transparent bg-clip-text bg-neon-gradient italic leading-tight">"Tools don’t transform businesses. Systems do."</p>
                 </div>
            </FadeIn>

            <FadeIn delay={300}>
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-midnight/50 border border-navy p-8 rounded-[2rem] hover:border-blue/50 transition-colors">
                        <h3 className="text-2xl font-serif text-white mb-4">Systems Thinker</h3>
                        <p className="leading-relaxed text-sm">
                            An idea is only as good as its implementation. My background in IT Project Management means I bring rigorous discipline to AI integration. 
                        </p>
                    </div>
                    <div className="bg-midnight/50 border border-navy p-8 rounded-[2rem] hover:border-purple/50 transition-colors">
                         <h3 className="text-2xl font-serif text-white mb-4">Execution Focused</h3>
                        <p className="leading-relaxed text-sm">
                            I define success metrics, manage timelines, and ensure that when we go live, the system is robust, documented, and ready for scale.
                        </p>
                    </div>
                </div>
            </FadeIn>

            <FadeIn delay={400}>
                <h3 className="text-3xl font-serif text-white mb-6">How I Work</h3>
                <p className="mb-8 leading-relaxed">
                    I am not a solo operator trying to be everything to everyone. I lead the strategy and integration architecture.
                    When a project requires specialized coding or niche automation, I bring in my network of vetted experts. I manage them, so you have one point of contact and one point of accountability.
                </p>
            </FadeIn>
        </div>
        
        <div className="mt-20 text-center">
             <Button to="/contact" variant="primary" size="large">Work With Me</Button>
        </div>
      </section>
      
       <section className="bg-midnight py-32 text-white text-center px-4 relative overflow-hidden rounded-t-[3rem] mx-2 border-t border-navy">
            <div className="absolute inset-0 bg-blue/5 mix-blend-overlay"></div>
            <FadeIn className="max-w-4xl mx-auto relative z-10">
                 <h2 className="text-2xl md:text-4xl font-serif mb-8 leading-relaxed font-light">
                   "Helping founders and leadership teams integrate AI and technology into their operations using a proven Change management framework that does not disrupt operations."
                 </h2>
                 <p className="text-blue mt-8 uppercase tracking-widest text-sm font-semibold">My Mission</p>
            </FadeIn>
       </section>
    </Layout>
  );
};

export default About;