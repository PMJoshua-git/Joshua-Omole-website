import React from 'react';
import Layout from '../components/Layout';
import FadeIn from '../components/FadeIn';
import { Helmet } from 'react-helmet-async';

import CustomContactForm from '../components/forms/CustomContactForm';

const Contact: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Book a session | Joshua Omole</title>
        <meta name="description" content="Find out exactly where your operation is leaking time, money, and momentum and walk away with three things you can act on immediately. Book a free 30-minute Systems Clarity Audit with Joshua Omole." />
        <meta property="og:title" content="Book a session | Joshua Omole" />
        <meta property="og:description" content="Find out exactly where your operation is leaking time, money, and momentum and walk away with three things you can act on immediately. Book a free 30-minute Systems Clarity Audit with Joshua Omole." />
      </Helmet>
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
    </>
  );
};

export default Contact;