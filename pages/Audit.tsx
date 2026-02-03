import React from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import FadeIn from '../components/FadeIn';
import { ArrowRight, Search, FileText, Lightbulb } from 'lucide-react';

const Audit: React.FC = () => {
  return (
    <Layout>
      <section className="bg-midnight text-white py-32 px-4 relative overflow-hidden rounded-b-[3rem] border-b border-navy">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>
        
        <FadeIn className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">AI & Tech Clarity Audit</h1>
          <p className="text-xl text-silver max-w-2xl mx-auto font-light">
            Cut through the noise. Get a 30-minute diagnosis of your current tech stack and AI potential.
          </p>
        </FadeIn>
      </section>

      <section className="py-24 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn direction="left">
                <h2 className="text-4xl font-serif text-white mb-8">Stop wondering "What if?"</h2>
                <div className="space-y-6 text-lg text-silver leading-relaxed">
                    <p>
                        You suspect your business could be more efficient. You see competitors using AI. But you don't know where to start, and you certainly don't have time to demo 50 different tools.
                    </p>
                    <p>
                        The Clarity Audit is a low-friction, high-value way to get an expert opinion on your operations without committing to a massive contract.
                    </p>
                </div>
                
                <div className="mt-10 bg-midnight p-8 rounded-[2rem] border border-navy hover:border-blue/50 transition-colors">
                    <p className="text-sm font-bold text-blue uppercase tracking-wide mb-2">The Outcome</p>
                    <p className="text-white font-medium text-lg">
                        You walk away with 3 actionable improvements you can make immediately, whether you hire me or not.
                    </p>
                </div>
            </FadeIn>

            <FadeIn direction="right" delay={200} className="h-full">
                <div className="bg-midnight border border-navy shadow-glow rounded-[3rem] p-10 h-full flex flex-col justify-between hover:shadow-glow-hover transition-shadow duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neon-gradient opacity-10 blur-3xl rounded-full"></div>
                    
                    <div className="relative z-10">
                        <h3 className="text-2xl font-serif text-white mb-10 pb-4 border-b border-navy">What I Cover</h3>
                        <div className="space-y-8">
                            <div className="flex group">
                                <div className="flex-shrink-0 mr-6">
                                    <div className="w-14 h-14 bg-navy/50 rounded-2xl flex items-center justify-center text-blue group-hover:bg-blue group-hover:text-white transition-colors border border-navy">
                                        <Search className="w-7 h-7" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-xl">Current Friction</h4>
                                    <p className="text-base text-silver mt-2 leading-relaxed">Where is time bleeding out of your business?</p>
                                </div>
                            </div>
                            <div className="flex group">
                                <div className="flex-shrink-0 mr-6">
                                    <div className="w-14 h-14 bg-navy/50 rounded-2xl flex items-center justify-center text-purple group-hover:bg-purple group-hover:text-white transition-colors border border-navy">
                                        <Lightbulb className="w-7 h-7" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-xl">AI Readiness</h4>
                                    <p className="text-base text-silver mt-2 leading-relaxed">Do you have the data and structure to actually use AI?</p>
                                </div>
                            </div>
                             <div className="flex group">
                                <div className="flex-shrink-0 mr-6">
                                    <div className="w-14 h-14 bg-navy/50 rounded-2xl flex items-center justify-center text-white group-hover:bg-white group-hover:text-obsidian transition-colors border border-navy">
                                        <FileText className="w-7 h-7" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-xl">Quick Wins</h4>
                                    <p className="text-base text-silver mt-2 leading-relaxed">Immediate tools or changes to implement now.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 relative z-10">
                        <Button to="/contact" className="w-full justify-center group" size="large">
                            Book Your Audit <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"/>
                        </Button>
                        <p className="text-xs text-center text-silver/50 mt-4">No pressure. No sales pitch.</p>
                    </div>
                </div>
            </FadeIn>
        </div>
      </section>
    </Layout>
  );
};

export default Audit;