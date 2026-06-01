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
            <h1 className="text-5xl md:text-6xl font-serif text-white mb-6 leading-tight">Let's Talk Strategy</h1>
            <p className="text-xl text-silver leading-relaxed max-w-2xl mx-auto">
              Get in touch to discuss your specific technological bottlenecks, potential AI integration, or project oversight needs.
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