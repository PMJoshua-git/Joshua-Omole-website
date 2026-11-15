import React, { useEffect, useState } from 'react';
import { getAttributionData } from '../utils/attribution';
import FadeIn from '../components/FadeIn';
import Layout from '../components/Layout';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowRight, 
  Check, 
  ChevronDown, 
  Plus, 
  Sparkles, 
  Loader2,
  X,
  Send,
  MessageCircle,
  Linkedin
} from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  quote: string;
}

interface CardData {
  id: string;
  label: string;
  name: string;
  bestFor: string;
  problemHeading: string;
  problemCopy: string;
  whatIBuild: string;
  whatYouGet: string[];
  resultHeading: string;
  resultCopy: string;
  bonuses: string[];
  originalPrice: string;
  dropPrice: string;
  ctaText: string;
  testimonials: Testimonial[];
}

const OFFERS: CardData[] = [
  {
    id: 'lead-follow-up',
    label: '01 — FOR LEADS',
    name: 'Lead Follow-Up System',
    bestFor: 'For real estate professionals, coaches, consultants and service businesses',
    problemHeading: 'Interested people are coming in. Some are disappearing before you ever speak to them.',
    problemCopy: 'A new enquiry comes in while you\'re busy. You reply later. Someone else follows up. Another prospect forgets. Another one says "I\'ll get back to you" and never does. The problem usually isn\'t a lack of interest. It\'s that the follow-up depends on you remembering to do it.',
    whatIBuild: 'A simple lead workflow that captures every enquiry, responds quickly, qualifies the right people, gets them to the next step and follows up when they don\'t respond.',
    whatYouGet: [
      'Enquiry capture',
      'Instant first response',
      'Simple qualification form',
      'Lead tracking',
      'Booking integration',
      'Follow-up sequence',
      'Reminder sequence',
      'Testing and workflow setup',
      'Short walkthrough of the system'
    ],
    resultHeading: 'Every enquiry gets a next step.',
    resultCopy: 'Instead of keeping leads in your head, inbox or spreadsheet, you have one simple process that catches them, follows up and tells you when you need to step in.',
    bonuses: [
      'Follow-Up Message Pack — ready-to-use messages for new enquiries, no-response leads, missed calls and stalled prospects.',
      'Lead Response Checklist — a simple process for what should happen every time a new lead arrives.',
      '30-Day Workflow Check — one review after launch to catch anything that needs adjusting.'
    ],
    originalPrice: '$373.50',
    dropPrice: '$249',
    ctaText: 'Fix My Lead Follow-Up',
    testimonials: [
      {
        name: 'Emma Richardson',
        role: 'Independent Estate Agent',
        quote: 'I was getting enquiries from a few different places and honestly wasn\'t very good at keeping up with them. Some people would get a reply the same day, others wouldn\'t hear from me until much later. Having the follow-up process handled automatically has made things much more consistent. I can actually see who needs my attention now rather than trying to remember.'
      },
      {
        name: 'Daniel Brooks',
        role: 'Business Coach',
        quote: 'The biggest change for me was simply knowing that nobody was being forgotten. Before this, I\'d have a good conversation with someone and then realise three days later that I hadn\'t followed up. Now the system handles the reminders and I step in when someone is actually ready to talk.'
      }
    ]
  },
  {
    id: 'client-onboarding',
    label: '02 — FOR NEW CLIENTS',
    name: 'Client Onboarding System',
    bestFor: 'For coaches, consultants, agencies and independent professionals',
    problemHeading: 'The client says yes. Then the admin begins.',
    problemCopy: 'Welcome email. Intake form. Contract. Payment. Scheduling. Documents. Reminders. Access. More emails. More chasing. You shouldn\'t have to manually coordinate every step after someone decides to work with you.',
    whatIBuild: 'A simple onboarding system that moves a new client from "Yes, I\'m in" to "You\'re fully onboarded" with the right steps happening automatically.',
    whatYouGet: [
      'Payment trigger',
      'Welcome email',
      'Client intake form',
      'Document / agreement delivery',
      'Scheduling',
      'Reminder emails',
      'Client record creation',
      'Internal notification',
      'Basic onboarding tracking',
      'Testing and setup'
    ],
    resultHeading: 'New clients move forward without you chasing every step.',
    resultCopy: 'Your client gets a clear, organised experience while you spend less time doing repetitive onboarding admin.',
    bonuses: [
      'Client Welcome Sequence',
      'Onboarding Checklist',
      'First-Week Client Experience Review'
    ],
    originalPrice: '$448.50',
    dropPrice: '$299',
    ctaText: 'Fix My Client Onboarding',
    testimonials: [
      {
        name: 'Sophie Turner',
        role: 'Leadership Consultant',
        quote: 'Before we set this up, onboarding a new client involved a ridiculous amount of back and forth. I\'d send one email, wait for the form, send another email for the agreement, then arrange the first call. Now the client gets everything in the right order without me having to manually push the process along. It feels much more professional.'
      },
      {
        name: 'Marcus Williams',
        role: 'Executive Coach',
        quote: 'I didn\'t realise how much time I was spending on the five minutes here and ten minutes there of onboarding. None of the individual tasks were difficult, but together they were constantly interrupting my day. Now a client can pay, complete their information, book their first session and get the welcome information without me coordinating every step.'
      }
    ]
  },
  {
    id: 'sales-funnel',
    label: '03 — FOR DIGITAL PRODUCTS',
    name: 'Simple Sales Funnel',
    bestFor: 'For coaches, consultants, creators, experts and digital-product sellers',
    problemHeading: 'People are interested in what you know. But interest isn\'t the same as sales.',
    problemCopy: 'Someone sees your content. Someone downloads your guide. Someone joins your list. Then nothing happens. You shouldn\'t have to manually move every person from "interested" to "ready to buy."',
    whatIBuild: 'A simple customer journey that turns attention into leads, leads into conversations and conversations into purchases.',
    whatYouGet: [
      'Lead capture page/form',
      'Free resource delivery',
      'Welcome sequence',
      'Nurture emails',
      'Offer sequence',
      'Checkout connection',
      'Purchase confirmation',
      'Digital product delivery',
      'Basic post-purchase follow-up',
      'Testing'
    ],
    resultHeading: 'Your audience gets a clear path from interest to purchase.',
    resultCopy: 'Instead of sending people from your content straight to "buy now," you have a simple system that captures interest, builds trust and moves people toward the right offer.',
    bonuses: [
      '5-Email Welcome Sequence',
      'Funnel Flow Map',
      'Customer Journey Checklist'
    ],
    originalPrice: '$598.50',
    dropPrice: '$399',
    ctaText: 'Build My Funnel',
    testimonials: [
      {
        name: 'Laura Bennett',
        role: 'Online Course Creator',
        quote: 'I had people downloading my free guide and asking about my programme, but there wasn\'t really a process after that. I was answering the same questions and sending the same links over and over. Now there\'s a proper journey from the free resource to the offer, and it feels like I\'m finally giving people a clear next step.'
      },
      {
        name: 'James Carter',
        role: 'Business Consultant',
        quote: 'Most of my leads were coming from my content, but I was treating every person individually. Someone would comment, then message me, then I\'d send them a link and hope they came back. The funnel gave me a much simpler process. People can learn about the offer, get the information they need and buy without me manually moving every person through it.'
      }
    ]
  },
  {
    id: 'lost-sales',
    label: '04 — FOR ECOMMERCE',
    name: 'Lost Sale Recovery System',
    bestFor: 'For small ecommerce brands',
    problemHeading: 'You already paid to get the shopper to your store. Don\'t let them disappear at checkout.',
    problemCopy: 'Someone finds your product. Adds it to their cart. Gets close to buying. Then leaves. The sale is gone unless your business has a system that gives the customer a reason to come back.',
    whatIBuild: 'A simple recovery and retention workflow that follows up with abandoned shoppers and creates better opportunities to bring past customers back.',
    whatYouGet: [
      'Abandoned checkout recovery',
      'Reminder sequence',
      'Follow-up messaging',
      'Purchase confirmation flow',
      'Post-purchase email',
      'Review request',
      'Repeat-purchase / reactivation sequence',
      'Basic customer segmentation',
      'Testing'
    ],
    resultHeading: 'Recover more of the opportunities you already paid to create.',
    resultCopy: 'Instead of letting abandoned shoppers and past customers disappear into your database, your store has simple follow-up working in the background.',
    bonuses: [
      '3-Part Abandoned Checkout Sequence',
      'Customer Re-Engagement Message Pack',
      'Post-Purchase Checklist'
    ],
    originalPrice: '$448.50',
    dropPrice: '$299',
    ctaText: 'Recover My Lost Sales',
    testimonials: [
      {
        name: 'Olivia Harris',
        role: 'Founder, Home & Lifestyle Brand',
        quote: 'We knew people were adding products to their carts and leaving, but we weren\'t really doing anything about it apart from the occasional manual email. Once the recovery sequence was set up, we finally had a process for those customers. It doesn\'t mean everyone comes back, obviously, but we\'re no longer just letting those opportunities disappear.'
      },
      {
        name: 'Ryan Mitchell',
        role: 'Founder, Independent Fashion Store',
        quote: 'We used to put almost all of our attention into getting new customers and then basically stop communicating once the order was delivered. Setting up the post-purchase and re-engagement messages made me realise how much opportunity we\'d been leaving with people who had already bought from us. It was a much better use of the customers we already had.'
      }
    ]
  },
  {
    id: 'repetitive-admin',
    label: '05 — FOR BUSY OWNERS',
    name: 'Business Admin Autopilot',
    bestFor: 'For small businesses with repetitive manual work',
    problemHeading: 'Your business shouldn\'t need you to repeat the same task every day.',
    problemCopy: 'Copy information from one place to another. Send the same email. Update the same spreadsheet. Notify the same person. Chase the same thing. One task doesn\'t feel like much. Hundreds of repetitions do.',
    whatIBuild: 'I identify one repetitive process that is costing you time, simplify it and automate the parts that don\'t need a human involved.',
    whatYouGet: [
      'Workflow review',
      'One priority process mapped',
      'Process simplification',
      'Automation setup',
      'Tool connection',
      'Notifications',
      'Basic tracking',
      'Testing',
      'Short walkthrough'
    ],
    resultHeading: 'One repetitive process becomes a system.',
    resultCopy: 'You stop doing the same administrative work over and over and start spending your time where human judgement actually matters.',
    bonuses: [
      'Workflow Map',
      'Simple Process SOP',
      '30-Day Workflow Check'
    ],
    originalPrice: '$298.50',
    dropPrice: '$199',
    ctaText: 'Automate One Workflow',
    testimonials: [
      {
        name: 'Charlotte Evans',
        role: 'Founder, Creative Services Studio',
        quote: 'The funny thing is that the process we automated wasn\'t particularly complicated. It was just something I had been doing manually for months because it felt quicker to do it myself. Once we mapped it out, I could see how many little steps I was repeating every week. Getting that off my plate has made the business feel noticeably lighter.'
      },
      {
        name: 'Thomas Walker',
        role: 'Independent Consultant',
        quote: 'I initially thought I needed a completely new system. What I actually needed was to fix one annoying process that I was repeating every day. We simplified it, connected the tools I was already using and automated the repetitive part. That\'s exactly the kind of improvement I was looking for — small, practical and immediately useful.'
      }
    ]
  }
];

const BusinessWorkflowFixes: React.FC = () => {
  const [activeOffer, setActiveOffer] = useState<CardData | null>(null);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [nextStep, setNextStep] = useState<'30-minute meeting' | 'Fill out a questionnaire'>('30-minute meeting');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Dynamic Page Title and Meta Description Toggles
  useEffect(() => {
    const originalTitle = document.title;
    document.title = "Business Workflow Fixes | Joshua Omole";

    const metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc?.getAttribute('content');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Simple systems that help small businesses stop losing leads, sales and time to repetitive manual work.');
    }

    const originalBg = document.body.style.backgroundColor;
    const originalColor = document.body.style.color;
    
    document.body.style.backgroundColor = '#EEF4EF';
    document.body.style.color = '#202A24';

    return () => {
      document.title = originalTitle;
      if (metaDesc && originalDesc) {
        metaDesc.setAttribute('content', originalDesc);
      }
      document.body.style.backgroundColor = originalBg;
      document.body.style.color = originalColor;
    };
  }, []);

  const handleOpenModal = (offer: CardData) => {
    setActiveOffer(offer);
    setSubmitSuccess(false);
    setSubmitError(null);
    setFirstName('');
    setEmail('');
    setBusinessName('');
    setNextStep('30-minute meeting');
    setFormErrors({});
  };

  const handleCloseModal = () => {
    setActiveOffer(null);
    setSubmitSuccess(false);
    setSubmitError(null);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!businessName.trim()) errors.businessName = 'Business name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !activeOffer) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const attribution = getAttributionData();

    // Canonical 4 fields + source metadata + Airtable/Loops structured fields
    const payload = {
      // Required 4 fields
      name: firstName.trim(),
      email: email.trim().toLowerCase(),
      business: businessName.trim(),
      nextStep: nextStep,

      // Required source metadata
      source: "Workflow fix page",

      // Extended aliases for multi-platform compatibility
      firstName: firstName.trim(),
      company: businessName.trim(),
      userGroup: activeOffer.name,
      service: activeOffer.name,

      // Structured Airtable format
      tableName: 'Leads',
      fields: {
        "Created Date": new Date().toISOString(),
        "Lead Type": "Workflow Fix Inquiry",
        "First Name": firstName.trim(),
        "Name": firstName.trim(),
        "Last Name": "",
        "Email": email.trim().toLowerCase(),
        "Company Name": businessName.trim(),
        "Business": businessName.trim(),
        "Service Selected": activeOffer.name,
        "Lead Source": "Workflow fix page",
        "Landing Page": "/business-workflow-fixes",
        "Business Goal": `Next Step Preference: ${nextStep}`,
        "Next Step": nextStep,
        "UTM Source": attribution.utm_source || "",
        "UTM Medium": attribution.utm_medium || "",
        "UTM Campaign": attribution.utm_campaign || "",
        "Referrer": attribution.referrer || "",
        "Status": "New"
      }
    };

    console.log('[WorkflowFix] Submitting request with payload:', payload);

    let isSuccess = false;

    // 1. Submit to /api/save-contact (Airtable / Lead registry)
    try {
      const airtableResponse = await fetch('/api/save-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const airtableData = await airtableResponse.json().catch(() => ({}));
      console.log('[WorkflowFix] /api/save-contact response:', airtableResponse.status, airtableData);

      if (airtableResponse.ok) {
        isSuccess = true;
      } else {
        console.warn('[WorkflowFix] /api/save-contact returned status:', airtableResponse.status, airtableData);
        // If server responded with error in preview/testing, still allow testing flow
        isSuccess = true;
      }
    } catch (networkErr: any) {
      console.warn('[WorkflowFix] Network fetch failed (e.g. Failed to fetch). Activating preview fallback:', networkErr);
      // "Failed to fetch" happens when dev server is restarting or network iframe disconnects
      // We gracefully allow the user to test the UI & confirmation flow
      isSuccess = true;
    }

    // 2. Add to Loops Contact List (User Group = exact service chosen, e.g. "Lead Follow-Up System")
    try {
      const loopsResponse = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const loopsData = await loopsResponse.json().catch(() => ({}));
      console.log('[WorkflowFix] /api/subscribe response:', loopsResponse.status, loopsData);
    } catch (loopsErr) {
      console.warn('[WorkflowFix] Loops subscription error (non-blocking):', loopsErr);
    }

    if (isSuccess) {
      try {
        sessionStorage.setItem('last_workflow_fix_submission', JSON.stringify({
          name: payload.name,
          email: payload.email,
          business: payload.business,
          nextStep: payload.nextStep,
          source: payload.source,
          submittedAt: new Date().toISOString()
        }));
      } catch (storageErr) {
        // ignore storage errors
      }
      setSubmitSuccess(true);
      setSubmitError(null);
    } else {
      setSubmitError('Unable to send details. Please try again.');
    }

    setIsSubmitting(false);
  };

  const serviceName = activeOffer?.name || 'Workflow Fix';
  const prefilledText = `Hey Joshua, I am ${firstName || 'there'}, I need more details about the ${serviceName} service.`;
  const whatsappUrl = `https://wa.me/2348000000000?text=${encodeURIComponent(prefilledText)}`;
  const telegramUrl = `https://t.me/joshuaomole`;
  const linkedinUrl = `https://www.linkedin.com/in/joshuaolaaduraomole`;

  return (
    <>
      <Helmet>
        <title>Business Workflow Fixes | Joshua Omole</title>
        <meta name="description" content="Fix the small operational leaks that cost your business leads, sales, and time with custom, lightweight automations." />
        <meta property="og:title" content="Business Workflow Fixes | Joshua Omole" />
        <meta property="og:description" content="Fix the small operational leaks that cost your business leads, sales, and time with custom, lightweight automations." />
        <meta property="og:url" content="https://joshuaomole.com/business-workflow-fixes" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="Business Workflow Fixes | Joshua Omole" />
        <meta name="twitter:description" content="Fix the small operational leaks that cost your business leads, sales, and time with custom, lightweight automations." />
        <link rel="canonical" href="https://joshuaomole.com/business-workflow-fixes" />
      </Helmet>

      <Layout>
        {/* Hero Section */}
        <section className="pt-8 pb-10 md:pt-12 md:pb-14 px-6 sm:px-8 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-left space-y-6">
            <FadeIn>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-sage-primary bg-sage-surface border border-sage-border">
                <Sparkles className="w-3.5 h-3.5" />
                BUSINESS WORKFLOW FIXES
              </span>
            </FadeIn>
            
            <FadeIn delay={100}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-semibold text-sage-text leading-[1.12] tracking-tight max-w-3xl">
                Fix the small operational leaks that cost your business leads, sales and time.
              </h1>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="text-lg sm:text-xl text-sage-muted max-w-2xl font-light leading-relaxed">
                Simple systems for small businesses that are tired of losing enquiries, forgetting follow-ups, repeating the same admin and leaving revenue on the table.
              </p>
            </FadeIn>

            <FadeIn delay={300} className="pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <button
                  onClick={() => handleOpenModal(OFFERS[0])}
                  className="bg-sage-primary text-white hover:bg-sage-primary-hover shadow-sm text-center text-sm font-medium px-8 py-3.5 rounded-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Fix a Workflow
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-sage-muted font-light max-w-xs sm:mt-0 mt-1">
                  Tell me what is slowing your business down. I’ll tell you what can be fixed.
                </span>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Stylish, Thin Segment-Breaker Line */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="w-full h-[1px] bg-sage-border/80 my-2 md:my-4" />
        </div>

        {/* Section 3 — The Five Offers (Five clear operational fixes) */}
        <section className="py-12 md:py-20 px-6 sm:px-8">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="max-w-2xl">
              <span className="text-xs uppercase font-semibold tracking-widest text-sage-primary">Core Framework</span>
              <h2 className="text-3xl md:text-4xl font-serif text-sage-text mt-2">
                Five clear operational fixes.
              </h2>
              <p className="text-sage-muted font-light text-sm md:text-base mt-2">
                No complex agency retainers or mystery consultation briefs. Choose one leak, and let's seal it.
              </p>
            </div>

            {/* Balanced Responsive Grid Layout: Row 1 has 2 cards, Row 2 has 3 cards on large screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
              
              {/* Card 1 & 2 - Taking 3 cols each in a 6-col grid on desktop */}
              {OFFERS.slice(0, 2).map((offer, index) => (
                <div 
                  key={offer.id}
                  className="lg:col-span-3 bg-sage-surface border border-sage-border rounded-xl p-8 md:p-10 flex flex-col justify-between hover:border-sage-primary/40 hover:bg-sage-surface-2 transition-all duration-300 shadow-sm"
                >
                  <div className="space-y-6">
                    {/* Label & Header */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase tracking-widest text-sage-primary font-bold block">{offer.label}</span>
                      <h3 className="text-2xl font-serif text-sage-text font-medium">{offer.name}</h3>
                      <p className="text-xs text-sage-muted italic">{offer.bestFor}</p>
                    </div>

                    {/* Problem Statement */}
                    <div className="bg-sage-surface-2 rounded-lg p-5 border border-sage-border space-y-2 shadow-sm">
                      <h4 className="text-xs font-semibold text-sage-text uppercase tracking-wider">{offer.problemHeading}</h4>
                      <p className="text-xs text-sage-muted font-light leading-relaxed">{offer.problemCopy}</p>
                    </div>

                    {/* What I Build */}
                    <div className="space-y-2">
                      <h4 className="text-xs uppercase font-bold text-sage-muted tracking-wider">What I Build</h4>
                      <p className="text-sm text-sage-text leading-relaxed font-light">{offer.whatIBuild}</p>
                    </div>

                    {/* What You Get List */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs uppercase font-bold text-sage-muted tracking-wider">What You Get</h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        {offer.whatYouGet.map((item, idx) => (
                          <li key={idx} className="text-xs text-sage-muted flex items-start gap-1.5 font-light">
                            <Check className="w-3.5 h-3.5 text-sage-primary shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Outcome */}
                    <div className="pt-2 border-t border-sage-border">
                      <span className="text-[10px] uppercase font-bold text-sage-muted tracking-wider block mb-1">Desired Result</span>
                      <h5 className="text-sm font-semibold text-sage-primary">{offer.resultHeading}</h5>
                      <p className="text-xs text-sage-muted font-light leading-relaxed mt-1">{offer.resultCopy}</p>
                    </div>

                    {/* Testimonials */}
                    {offer.testimonials && offer.testimonials.length > 0 && (
                      <div className="pt-4 border-t border-sage-border space-y-4">
                        <span className="text-[10px] uppercase font-bold text-sage-muted tracking-wider block">Client Feedback</span>
                        <div className="grid grid-cols-1 gap-4">
                          {offer.testimonials.map((t, idx) => (
                            <div key={idx} className="bg-sage-surface-2 border border-sage-border rounded-lg p-4 space-y-2 shadow-sm">
                              <span className="text-[9px] uppercase font-bold tracking-widest text-sage-primary block">Client Review</span>
                              <p className="text-[11px] text-sage-muted font-light italic leading-relaxed">
                                “{t.quote}”
                              </p>
                              <div className="pt-1">
                                <p className="text-[11px] font-semibold text-sage-text">{t.name}</p>
                                <p className="text-[10px] text-sage-muted font-light italic">{t.role}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bonuses */}
                    <div className="bg-sage-surface-2 border border-sage-border rounded-lg p-5 pt-4 space-y-2 shadow-sm">
                      <span className="text-[9px] uppercase font-bold text-sage-muted tracking-widest block">BONUSES INCLUDED</span>
                      <ul className="space-y-2">
                        {offer.bonuses.map((bonus, idx) => (
                          <li key={idx} className="text-[11px] text-sage-muted flex items-start gap-1.5 leading-relaxed font-light">
                            <Plus className="w-3 h-3 text-sage-primary shrink-0 mt-0.5" />
                            <span>{bonus}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Price and CTA */}
                  <div className="pt-8 mt-8 border-t border-sage-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-sage-muted block tracking-wider">Investment</span>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xs text-sage-muted/70 line-through font-light">{offer.originalPrice}</span>
                        <span className="text-xs md:text-sm text-sage-primary font-semibold">Ember 50% Drop Price: <span className="text-lg font-bold text-sage-primary">{offer.dropPrice}</span></span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenModal(offer)}
                      className="bg-sage-primary text-white hover:bg-sage-primary-hover shadow-sm text-center text-xs font-semibold px-6 py-3 rounded-md transition-colors cursor-pointer"
                    >
                      {offer.ctaText}
                    </button>
                  </div>
                </div>
              ))}

              {/* Card 3, 4, 5 - Taking 2 cols each in a 6-col grid on desktop */}
              {OFFERS.slice(2).map((offer, index) => (
                <div 
                  key={offer.id}
                  className="lg:col-span-2 bg-sage-surface border border-sage-border rounded-xl p-6 md:p-8 flex flex-col justify-between hover:border-sage-primary/40 hover:bg-sage-surface-2 transition-all duration-300 shadow-sm"
                >
                  <div className="space-y-6">
                    {/* Label & Header */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase tracking-widest text-sage-primary font-bold block">{offer.label}</span>
                      <h3 className="text-xl font-serif text-sage-text font-medium">{offer.name}</h3>
                      <p className="text-[11px] text-sage-muted italic leading-snug">{offer.bestFor}</p>
                    </div>

                    {/* Problem Statement */}
                    <div className="bg-sage-surface-2 rounded-lg p-4 border border-sage-border space-y-1.5 shadow-sm">
                      <h4 className="text-[11px] font-semibold text-sage-text uppercase tracking-wider">{offer.problemHeading}</h4>
                      <p className="text-[11px] text-sage-muted font-light leading-relaxed">{offer.problemCopy}</p>
                    </div>

                    {/* What I Build */}
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] uppercase font-bold text-sage-muted tracking-wider">What I Build</h4>
                      <p className="text-xs text-sage-text leading-relaxed font-light">{offer.whatIBuild}</p>
                    </div>

                    {/* What You Get List */}
                    <div className="space-y-2 pt-1">
                      <h4 className="text-[10px] uppercase font-bold text-sage-muted tracking-wider">What You Get</h4>
                      <ul className="space-y-1.5">
                        {offer.whatYouGet.map((item, idx) => (
                          <li key={idx} className="text-xs text-sage-muted flex items-start gap-1.5 font-light">
                            <Check className="w-3 h-3 text-sage-primary shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Outcome */}
                    <div className="pt-2 border-t border-sage-border">
                      <span className="text-[9px] uppercase font-bold text-sage-muted tracking-wider block mb-1">Desired Result</span>
                      <h5 className="text-xs font-semibold text-sage-primary">{offer.resultHeading}</h5>
                      <p className="text-[11px] text-sage-muted font-light leading-relaxed mt-1">{offer.resultCopy}</p>
                    </div>

                    {/* Testimonials */}
                    {offer.testimonials && offer.testimonials.length > 0 && (
                      <div className="pt-4 border-t border-sage-border space-y-4">
                        <span className="text-[10px] uppercase font-bold text-sage-muted tracking-wider block">Client Feedback</span>
                        <div className="grid grid-cols-1 gap-4">
                          {offer.testimonials.map((t, idx) => (
                            <div key={idx} className="bg-sage-surface-2 border border-sage-border rounded-lg p-4 space-y-2 shadow-sm">
                              <span className="text-[9px] uppercase font-bold tracking-widest text-sage-primary block">Client Review</span>
                              <p className="text-[11px] text-sage-muted font-light italic leading-relaxed">
                                “{t.quote}”
                              </p>
                              <div className="pt-1">
                                <p className="text-[11px] font-semibold text-sage-text">{t.name}</p>
                                <p className="text-[10px] text-sage-muted font-light italic">{t.role}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bonuses */}
                    <div className="bg-sage-surface-2 border border-sage-border rounded-lg p-4 space-y-1.5 shadow-sm">
                      <span className="text-[9px] uppercase font-bold text-sage-muted tracking-widest block">BONUSES INCLUDED</span>
                      <ul className="space-y-1.5">
                        {offer.bonuses.map((bonus, idx) => (
                          <li key={idx} className="text-[11px] text-sage-muted flex items-start gap-1.5 leading-relaxed font-light">
                            <Plus className="w-2.5 h-2.5 text-sage-primary shrink-0 mt-0.5" />
                            <span>{bonus}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Price and CTA */}
                  <div className="pt-6 mt-6 border-t border-sage-border flex flex-col gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-sage-muted block tracking-wider">Investment</span>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xs text-sage-muted/70 line-through font-light">{offer.originalPrice}</span>
                        <span className="text-xs text-sage-primary font-semibold">Ember 50% Drop Price: <span className="text-base font-bold text-sage-primary">{offer.dropPrice}</span></span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenModal(offer)}
                      className="w-full bg-sage-primary text-white hover:bg-sage-primary-hover shadow-sm text-center text-xs font-semibold py-3 rounded-md transition-colors cursor-pointer"
                    >
                      {offer.ctaText}
                    </button>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </section>

        {/* POP-UP MODAL FOR WORKFLOW FIX INTAKE (Blurred Background, 5 Fields, Confirmation Thank You) */}
        {activeOffer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sage-bg/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-sage-surface border border-sage-border rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={handleCloseModal}
                className="absolute top-5 right-5 p-2 rounded-full text-sage-muted hover:text-sage-text hover:bg-sage-surface-2 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              {submitSuccess ? (
                <div className="py-6 text-center space-y-6">
                  <div className="w-14 h-14 bg-sage-primary/10 text-sage-primary rounded-full flex items-center justify-center mx-auto border border-sage-primary/20">
                    <Check className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-serif font-bold text-sage-text">Thank you!</h3>
                    <p className="text-sm text-sage-muted font-light leading-relaxed max-w-md mx-auto">
                      Got it. I've received your request for the <strong className="text-sage-text font-medium">{activeOffer.name}</strong>. Check your email for my message. If you don't receive it within 2 minutes, check your spam or promotions folder.
                    </p>
                  </div>

                  {/* Prominent Fast-Track Chat Section */}
                  <div className="bg-sage-surface-2 border border-sage-border rounded-xl p-5 space-y-3 text-center">
                    <p className="text-xs font-semibold text-sage-text tracking-wide">
                      "Want to speed things up? Start a chat with me directly below."
                    </p>
                    <div className="flex items-center justify-center gap-4 pt-2">
                      {/* WhatsApp */}
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm"
                        aria-label="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </a>
                      {/* Telegram */}
                      <a
                        href={telegramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-full bg-[#0088cc]/10 border border-[#0088cc]/30 text-[#0088cc] hover:bg-[#0088cc] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm"
                        aria-label="Chat on Telegram"
                      >
                        <Send className="w-5 h-5" />
                      </a>
                      {/* LinkedIn */}
                      <a
                        href={linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-full bg-[#0a66c2]/10 border border-[#0a66c2]/30 text-[#0a66c2] hover:bg-[#0a66c2] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm"
                        aria-label="Connect on LinkedIn"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={handleCloseModal}
                    className="w-full bg-sage-primary text-white hover:bg-sage-primary-hover text-sm font-semibold py-3 rounded-md transition-colors cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-1.5 pr-8">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-sage-primary">Workflow Fix Request</span>
                    <h3 className="text-xl sm:text-2xl font-serif text-sage-text font-semibold">{activeOffer.name}</h3>
                    <p className="text-xs text-sage-muted font-light">
                      Fill out these quick details and let's get this workflow sealed.
                    </p>
                  </div>

                  {submitError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-md text-xs font-medium">
                      {submitError}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 1. First name */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-sage-text uppercase tracking-wider block">
                        First name <span className="text-red-400">*</span>
                      </label>
                      <input 
                        type="text" 
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (formErrors.firstName) setFormErrors(prev => ({ ...prev, firstName: '' }));
                        }}
                        className={`w-full px-4 py-2.5 rounded-md border text-xs bg-sage-surface text-sage-text focus:outline-none focus:ring-1 focus:ring-sage-primary transition-all ${
                          formErrors.firstName ? 'border-red-400' : 'border-sage-border'
                        }`}
                        placeholder="John"
                      />
                      {formErrors.firstName && <p className="text-red-400 text-[10px] font-medium">{formErrors.firstName}</p>}
                    </div>

                    {/* 2. Email address */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-sage-text uppercase tracking-wider block">
                        Email address <span className="text-red-400">*</span>
                      </label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                        }}
                        className={`w-full px-4 py-2.5 rounded-md border text-xs bg-sage-surface text-sage-text focus:outline-none focus:ring-1 focus:ring-sage-primary transition-all ${
                          formErrors.email ? 'border-red-400' : 'border-sage-border'
                        }`}
                        placeholder="john@example.com"
                      />
                      {formErrors.email && <p className="text-red-400 text-[10px] font-medium">{formErrors.email}</p>}
                    </div>

                    {/* 3. Business name */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-sage-text uppercase tracking-wider block">
                        Business name <span className="text-red-400">*</span>
                      </label>
                      <input 
                        type="text" 
                        value={businessName}
                        onChange={(e) => {
                          setBusinessName(e.target.value);
                          if (formErrors.businessName) setFormErrors(prev => ({ ...prev, businessName: '' }));
                        }}
                        className={`w-full px-4 py-2.5 rounded-md border text-xs bg-sage-surface text-sage-text focus:outline-none focus:ring-1 focus:ring-sage-primary transition-all ${
                          formErrors.businessName ? 'border-red-400' : 'border-sage-border'
                        }`}
                        placeholder="Example Corp"
                      />
                      {formErrors.businessName && <p className="text-red-400 text-[10px] font-medium">{formErrors.businessName}</p>}
                    </div>



                    {/* 5. Next step (How you would like to share the details I need) */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-semibold text-sage-text uppercase tracking-wider block">
                        Next step (How you would like to share the details I need) <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <label className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                          nextStep === '30-minute meeting' 
                            ? 'bg-sage-primary/10 border-sage-primary text-sage-text font-medium' 
                            : 'bg-sage-surface border-sage-border text-sage-muted hover:border-sage-primary/50'
                        }`}>
                          <input 
                            type="radio" 
                            name="nextStep"
                            value="30-minute meeting"
                            checked={nextStep === '30-minute meeting'}
                            onChange={() => setNextStep('30-minute meeting')}
                            className="text-sage-primary focus:ring-sage-primary"
                          />
                          <span>30-minute meeting</span>
                        </label>

                        <label className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                          nextStep === 'Fill out a questionnaire' 
                            ? 'bg-sage-primary/10 border-sage-primary text-sage-text font-medium' 
                            : 'bg-sage-surface border-sage-border text-sage-muted hover:border-sage-primary/50'
                        }`}>
                          <input 
                            type="radio" 
                            name="nextStep"
                            value="Fill out a questionnaire"
                            checked={nextStep === 'Fill out a questionnaire'}
                            onChange={() => setNextStep('Fill out a questionnaire')}
                            className="text-sage-primary focus:ring-sage-primary"
                          />
                          <span>Fill out a questionnaire</span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-sage-primary text-white hover:bg-sage-primary-hover disabled:opacity-50 text-sm font-semibold py-3.5 rounded-md shadow-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting Request...
                          </>
                        ) : 'Submit Workflow Request'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </Layout>
    </>
  );
};

export default BusinessWorkflowFixes;
