import React from 'react';
import Layout from '../components/Layout';
import FadeIn from '../components/FadeIn';

const Contact: React.FC = () => {
  return (
    <Layout>
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          
          <FadeIn direction="left">
            <h1 className="text-5xl md:text-6xl font-serif text-white mb-8 leading-tight">Let's Talk Strategy</h1>
            <p className="text-xl text-silver mb-12 leading-relaxed">
              Whether you are ready to overhaul your entire operation or just need a second opinion on a specific tech problem, it starts with a conversation.
            </p>
            
            <div className="bg-midnight p-10 rounded-[2.5rem] mb-8 border border-navy hover:border-blue/30 transition-colors">
              <h3 className="font-serif text-white mb-8 text-2xl">What happens next?</h3>
              <ol className="list-none space-y-6 text-silver">
                <li className="flex items-start">
                   <span className="flex-shrink-0 w-8 h-8 rounded-full bg-navy border border-blue/30 text-white font-serif text-sm flex items-center justify-center mr-4 shadow-sm">1</span>
                   <span className="mt-1">You fill out the form with a brief summary of your needs.</span>
                </li>
                <li className="flex items-start">
                   <span className="flex-shrink-0 w-8 h-8 rounded-full bg-navy border border-blue/30 text-white font-serif text-sm flex items-center justify-center mr-4 shadow-sm">2</span>
                   <span className="mt-1">I review to ensure I can actually help you.</span>
                </li>
                <li className="flex items-start">
                   <span className="flex-shrink-0 w-8 h-8 rounded-full bg-navy border border-blue/30 text-white font-serif text-sm flex items-center justify-center mr-4 shadow-sm">3</span>
                   <span className="mt-1">We schedule a 30-45 minute strategy call via Zoom.</span>
                </li>
                <li className="flex items-start">
                   <span className="flex-shrink-0 w-8 h-8 rounded-full bg-navy border border-blue/30 text-white font-serif text-sm flex items-center justify-center mr-4 shadow-sm">4</span>
                   <span className="mt-1">We discuss your bottlenecks and potential solutions.</span>
                </li>
              </ol>
            </div>
          </FadeIn>

          <FadeIn direction="right" delay={200}>
            <div className="bg-white/5 border border-navy p-4 md:p-6 shadow-glow rounded-[2rem] relative overflow-hidden h-full min-h-[800px]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple/10 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none"></div>
                
                <iframe
                  id="JotFormIFrame-260335882227055"
                  title="Strategy Call Booking"
                  allowTransparency={true}
                  allowFullScreen={true}
                  src="https://form.jotform.com/260335882227055"
                  className="w-full h-full border-none min-h-[750px] rounded-xl bg-white"
                  scrolling="yes"
                >
                </iframe>
            </div>
          </FadeIn>

        </div>
      </section>
    </Layout>
  );
};

export default Contact;