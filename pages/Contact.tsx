import React from 'react';
import Layout from '../components/Layout';
import FadeIn from '../components/FadeIn';

import CustomContactForm from '../components/forms/CustomContactForm';

const Contact: React.FC = () => {
  return (
    <Layout>
      <section className="py-24 px-4 max-w-4xl mx-auto">
        <FadeIn direction="up">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-serif text-white mb-6 leading-tight">Let's Look at Your Operation</h1>
            <p className="text-xl text-silver leading-relaxed max-w-2xl mx-auto">
              Whether you're dealing with operational friction, thinking about AI adoption, or need a clear-eyed look at how your business is actually running — this is where to start.
            </p>
          </div>
        </FadeIn>
          
        <FadeIn direction="up" delay={100}>
          <CustomContactForm />
        </FadeIn>
      </section>
    </Layout>
  );
};

export default Contact;