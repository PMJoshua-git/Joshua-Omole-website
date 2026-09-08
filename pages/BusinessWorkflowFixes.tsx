import React, { useEffect, useState, useRef } from 'react';
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
  Briefcase, 
  Users, 
  Compass, 
  TrendingUp, 
  HelpCircle, 
  Loader2 
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
  const formRef = useRef<HTMLDivElement>(null);
  
  // State variables
  const [selectedProblem, setSelectedProblem] = useState<string>('Lead Follow-Up');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    businessWebsite: '',
    email: '',
    businessType: 'Consulting',
    currentHappens: '',
    desiredHappens: '',
    tools: '',
    timeline: 'ASAP'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Dynamic Page Title and Meta Description Toggles
  useEffect(() => {
    // Save original titles and body styling
    const originalTitle = document.title;
    document.title = "Business Workflow Fixes | Joshua Omole";

    const metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc?.getAttribute('content');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Simple systems that help small businesses stop losing leads, sales and time to repetitive manual work.');
    }

    const originalBg = document.body.style.backgroundColor;
    const originalColor = document.body.style.color;
    
    // Smooth transition
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#111111';

    return () => {
      // Revert upon component unmount
      document.title = originalTitle;
      if (metaDesc && originalDesc) {
        metaDesc.setAttribute('content', originalDesc);
      }
      document.body.style.backgroundColor = originalBg;
      document.body.style.color = originalColor;
    };
  }, []);

  const handleScrollToForm = (problemLabel?: string) => {
    if (problemLabel) {
      setSelectedProblem(problemLabel);
      setFormData(prev => ({ ...prev, problem: problemLabel }));
    }
    
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Your name is required';
    if (!formData.businessName.trim()) errors.businessName = 'Business name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.currentHappens.trim()) errors.currentHappens = 'Please describe what currently happens';
    if (!formData.desiredHappens.trim()) errors.desiredHappens = 'Please tell me what you would like to happen';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    // Split Name safely
    const nameParts = formData.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const attribution = getAttributionData();

    // Construct unified payload for Airtable
    const airtableFields = {
      "Created Date": new Date().toISOString(),
      "Lead Type": "Workflow Fix Inquiry",
      "First Name": firstName,
      "Last Name": lastName,
      "Email": formData.email,
      "Company Name": formData.businessName,
      "Service Selected": `Workflow Fix: ${selectedProblem}`,
      "Business Goal": `Business Website: ${formData.businessWebsite}
Tools Used: ${formData.tools || 'None specified'}
Business Type: ${formData.businessType}
How soon: ${formData.timeline}

WHAT CURRENTLY HAPPENS:
${formData.currentHappens}

WHAT DESIRED HAPPENS:
${formData.desiredHappens}`,
      "Lead Source": attribution.lead_source || "direct",
      "Landing Page": "/business-workflow-fixes",
      "UTM Source": attribution.utm_source || "",
      "UTM Medium": attribution.utm_medium || "",
      "UTM Campaign": attribution.utm_campaign || "",
      "Referrer": attribution.referrer || "",
      "Status": "New"
    };

    try {
      console.log('--- STARTING WORKFLOW FIX FORM SUBMISSION ---');
      console.log('Airtable Payload:', { tableName: 'Leads', fields: airtableFields });

      // 1. Save Lead to Airtable
      console.log('Sending request to /api/save-contact...');
      const airtableResponse = await fetch('/api/save-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tableName: 'Leads',
          fields: airtableFields
        })
      });

      console.log('Airtable Response Status:', airtableResponse.status);
      const airtableData = await airtableResponse.json().catch(() => ({}));
      console.log('Airtable Response Body:', airtableData);

      if (!airtableResponse.ok) {
        throw new Error(`Airtable submission failed with status ${airtableResponse.status}: ${airtableData.error || 'Unknown error'}`);
      }

      console.log('Airtable saved successfully!');

      // 2. Add to Loops Contact List
      const loopsPayload = {
        email: formData.email,
        firstName: firstName,
        lastName: lastName,
        userGroup: `Workflow: ${selectedProblem}`,
        company: formData.businessName,
        country: '',
        companySize: ''
      };
      
      console.log('Loops Payload:', loopsPayload);
      console.log('Sending request to /api/subscribe...');

      try {
        const loopsResponse = await fetch('/api/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(loopsPayload)
        });
        
        console.log('Loops Response Status:', loopsResponse.status);
        const loopsData = await loopsResponse.json().catch(() => ({}));
        console.log('Loops Response Body:', loopsData);
        
        if (!loopsResponse.ok) {
          console.warn('Loops subscription returned non-ok status:', loopsResponse.status);
        } else {
          console.log('Loops subscribed successfully!');
        }
      } catch (loopsErr) {
        console.error('Error adding contact to Loops:', loopsErr);
      }

      console.log('--- WORKFLOW FIX FORM SUBMISSION COMPLETED ---');
      setSubmitSuccess(true);
      // Reset form
      setFormData({
        name: '',
        businessName: '',
        businessWebsite: '',
        email: '',
        businessType: 'Consulting',
        currentHappens: '',
        desiredHappens: '',
        tools: '',
        timeline: 'ASAP'
      });
    } catch (err: any) {
      console.error('Submission error:', err);
      setSubmitError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Business Workflow Fixes | Joshua Omole</title>
        <meta name="description" content="Fix the small operational leaks that cost your business leads, sales, and time with custom, lightweight automations." />
      </Helmet>

      <Layout>
        {/* Hero Section */}
        <section className="py-20 md:py-28 px-6 sm:px-8 relative overflow-hidden">
          {/* Subtle glows to match the homepage */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue rounded-full blur-[150px] opacity-10 pointer-events-none -z-10"></div>
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-purple rounded-full blur-[150px] opacity-10 pointer-events-none -z-10"></div>

          <div className="max-w-4xl mx-auto text-left space-y-8">
            <FadeIn>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue/10 border border-blue/30 text-blue">
                <Sparkles className="w-3.5 h-3.5" />
                BUSINESS WORKFLOW FIXES
              </span>
            </FadeIn>
            
            <FadeIn delay={100}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-semibold text-white leading-[1.12] tracking-tight max-w-3xl">
                Fix the small operational leaks that cost your business leads, sales and time.
              </h1>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="text-lg sm:text-xl text-silver max-w-2xl font-light leading-relaxed">
                Simple systems for small businesses that are tired of losing enquiries, forgetting follow-ups, repeating the same admin and leaving revenue on the table.
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <p className="text-base text-silver/70 max-w-xl font-light">
                I take one important process in your business, simplify it, connect the right tools and make it run with far less manual work.
              </p>
            </FadeIn>

            <FadeIn delay={400} className="pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <button
                  onClick={() => handleScrollToForm()}
                  className="bg-gradient-to-tr from-blue to-purple text-white hover:opacity-90 shadow-glow text-center text-sm font-medium px-8 py-3.5 rounded-md transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Fix a Workflow
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-silver/50 font-light max-w-xs sm:mt-0 mt-1">
                  Tell me what is slowing your business down. I’ll tell you what can be fixed.
                </span>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Section 2 — Introduce the Core Idea */}
        <section className="py-20 md:py-28 px-6 sm:px-8 bg-midnight/30 border-y border-navy/40 relative">
          <div className="max-w-4xl mx-auto space-y-16">
            {/* Visual Process Map */}
            <FadeIn delay={150} className="bg-midnight/60 border border-navy/50 rounded-xl p-8 sm:p-10 shadow-glow space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center relative">
                
                {/* Step 1 */}
                <div className="bg-obsidian border border-navy/40 rounded-lg p-5 text-center flex flex-col justify-center min-h-[110px] relative z-10">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-silver/40 block mb-1">Trigger</span>
                  <span className="text-sm font-medium text-silver">Customer does something</span>
                </div>
                
                {/* Connector */}
                <div className="hidden md:flex justify-center text-navy">
                  <ArrowRight className="w-5 h-5" />
                </div>

                {/* Step 2 */}
                <div className="bg-obsidian border border-navy/40 rounded-lg p-5 text-center flex flex-col justify-center min-h-[110px] relative z-10">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-silver/40 block mb-1">Action</span>
                  <span className="text-sm font-medium text-silver">Your system responds</span>
                </div>

                {/* Connector */}
                <div className="hidden md:flex justify-center text-navy">
                  <ArrowRight className="w-5 h-5" />
                </div>

                {/* Step 3 */}
                <div className="bg-obsidian border border-navy/40 rounded-lg p-5 text-center flex flex-col justify-center min-h-[110px] relative z-10">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-silver/40 block mb-1">Capture</span>
                  <span className="text-sm font-medium text-silver">Information is captured</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                {/* Step 4 */}
                <div className="md:col-start-2 bg-obsidian border border-navy/40 rounded-lg p-5 text-center flex flex-col justify-center min-h-[110px]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-silver/40 block mb-1">Process</span>
                  <span className="text-sm font-medium text-silver">Next step happens automatically</span>
                </div>

                {/* Connector */}
                <div className="hidden md:flex justify-center text-navy">
                  <ArrowRight className="w-5 h-5" />
                </div>

                {/* Step 5 */}
                <div className="bg-blue/10 border border-blue/30 rounded-lg p-5 text-center flex flex-col justify-center min-h-[110px]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue block mb-1">Human</span>
                  <span className="text-sm font-medium text-white">You step in only when you need to</span>
                </div>
              </div>

              <div className="pt-4 border-t border-navy/40 flex flex-col sm:flex-row items-center justify-between text-xs text-silver/50 font-light gap-2">
                <span>One problem. One workflow. One clear outcome.</span>
                <span className="font-serif italic text-silver/40">Design with architectural intent</span>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Section 3 — The Five Offers */}
        <section className="py-20 md:py-28 px-6 sm:px-8">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="max-w-2xl">
              <span className="text-xs uppercase font-semibold tracking-widest text-blue">Core Framework</span>
              <h2 className="text-3xl md:text-4xl font-serif text-white mt-2">
                Five clear operational fixes.
              </h2>
              <p className="text-silver/70 font-light text-sm md:text-base mt-2">
                No complex agency retainers or mystery consultation briefs. Choose one leak, and let's seal it.
              </p>
            </div>

            {/* Balanced Responsive Grid Layout: Row 1 has 2 cards, Row 2 has 3 cards on large screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
              
              {/* Card 1 & 2 - Taking 3 cols each in a 6-col grid on desktop */}
              {OFFERS.slice(0, 2).map((offer, index) => (
                <div 
                  key={offer.id}
                  className="lg:col-span-3 bg-midnight/50 border border-navy/60 rounded-xl p-8 md:p-10 flex flex-col justify-between hover:border-blue/40 transition-all duration-300 hover:shadow-glow"
                >
                  <div className="space-y-6">
                    {/* Label & Header */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase tracking-widest text-blue font-bold block">{offer.label}</span>
                      <h3 className="text-2xl font-serif text-white font-medium">{offer.name}</h3>
                      <p className="text-xs text-silver/50 italic">{offer.bestFor}</p>
                    </div>

                    {/* Problem Statement */}
                    <div className="bg-obsidian/60 rounded-lg p-5 border border-navy/40 space-y-2">
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider">{offer.problemHeading}</h4>
                      <p className="text-xs text-silver/70 font-light leading-relaxed">{offer.problemCopy}</p>
                    </div>

                    {/* What I Build */}
                    <div className="space-y-2">
                      <h4 className="text-xs uppercase font-bold text-silver/40 tracking-wider">What I Build</h4>
                      <p className="text-sm text-silver leading-relaxed font-light">{offer.whatIBuild}</p>
                    </div>

                    {/* What You Get List */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs uppercase font-bold text-silver/40 tracking-wider">What You Get</h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        {offer.whatYouGet.map((item, idx) => (
                          <li key={idx} className="text-xs text-silver/70 flex items-start gap-1.5 font-light">
                            <Check className="w-3.5 h-3.5 text-blue shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Outcome */}
                    <div className="pt-2 border-t border-navy/40">
                      <span className="text-[10px] uppercase font-bold text-silver/40 tracking-wider block mb-1">Desired Result</span>
                      <h5 className="text-sm font-semibold text-white">{offer.resultHeading}</h5>
                      <p className="text-xs text-silver/70 font-light leading-relaxed mt-1">{offer.resultCopy}</p>
                    </div>

                    {/* Testimonials */}
                    {offer.testimonials && offer.testimonials.length > 0 && (
                      <div className="pt-4 border-t border-navy/40 space-y-4">
                        <span className="text-[10px] uppercase font-bold text-silver/40 tracking-wider block">Client Feedback</span>
                        <div className="grid grid-cols-1 gap-4">
                          {offer.testimonials.map((t, idx) => (
                            <div key={idx} className="bg-obsidian/60 border border-navy/40 rounded-lg p-4 space-y-2">
                              <span className="text-[9px] uppercase font-bold tracking-widest text-blue block">Client Review</span>
                              <p className="text-[11px] text-silver/70 font-light italic leading-relaxed">
                                “{t.quote}”
                              </p>
                              <div className="pt-1">
                                <p className="text-[11px] font-semibold text-white">{t.name}</p>
                                <p className="text-[10px] text-silver/50 font-light italic">{t.role}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bonuses */}
                    <div className="bg-obsidian/40 border border-navy/40 rounded-lg p-5 pt-4 space-y-2">
                      <span className="text-[9px] uppercase font-bold text-silver/40 tracking-widest block">BONUSES INCLUDED</span>
                      <ul className="space-y-2">
                        {offer.bonuses.map((bonus, idx) => (
                          <li key={idx} className="text-[11px] text-silver/70 flex items-start gap-1.5 leading-relaxed font-light">
                            <Plus className="w-3 h-3 text-blue shrink-0 mt-0.5" />
                            <span>{bonus}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Price and CTA */}
                  <div className="pt-8 mt-8 border-t border-navy/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-silver/40 block tracking-wider">Investment</span>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xs text-silver/50 line-through font-light">{offer.originalPrice}</span>
                        <span className="text-xs md:text-sm text-amber-300 font-medium">Ember 50% Drop Price: <span className="text-lg font-bold text-white">{offer.dropPrice}</span></span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleScrollToForm(offer.name)}
                      className="bg-gradient-to-tr from-blue to-purple text-white hover:opacity-90 shadow-glow text-center text-xs font-semibold px-6 py-3 rounded-md transition-colors"
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
                  className="lg:col-span-2 bg-midnight/50 border border-navy/60 rounded-xl p-6 md:p-8 flex flex-col justify-between hover:border-blue/40 transition-all duration-300 hover:shadow-glow"
                >
                  <div className="space-y-6">
                    {/* Label & Header */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase tracking-widest text-blue font-bold block">{offer.label}</span>
                      <h3 className="text-xl font-serif text-white font-medium">{offer.name}</h3>
                      <p className="text-[11px] text-silver/50 italic leading-snug">{offer.bestFor}</p>
                    </div>

                    {/* Problem Statement */}
                    <div className="bg-obsidian/60 rounded-lg p-4 border border-navy/40 space-y-1.5">
                      <h4 className="text-[11px] font-semibold text-white uppercase tracking-wider">{offer.problemHeading}</h4>
                      <p className="text-[11px] text-silver/70 font-light leading-relaxed">{offer.problemCopy}</p>
                    </div>

                    {/* What I Build */}
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] uppercase font-bold text-silver/40 tracking-wider">What I Build</h4>
                      <p className="text-xs text-silver leading-relaxed font-light">{offer.whatIBuild}</p>
                    </div>

                    {/* What You Get List */}
                    <div className="space-y-2 pt-1">
                      <h4 className="text-[10px] uppercase font-bold text-silver/40 tracking-wider">What You Get</h4>
                      <ul className="space-y-1.5">
                        {offer.whatYouGet.map((item, idx) => (
                          <li key={idx} className="text-xs text-silver/70 flex items-start gap-1.5 font-light">
                            <Check className="w-3 h-3 text-blue shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Outcome */}
                    <div className="pt-2 border-t border-navy/40">
                      <span className="text-[9px] uppercase font-bold text-silver/40 tracking-wider block mb-1">Desired Result</span>
                      <h5 className="text-xs font-semibold text-white">{offer.resultHeading}</h5>
                      <p className="text-[11px] text-silver/70 font-light leading-relaxed mt-1">{offer.resultCopy}</p>
                    </div>

                    {/* Testimonials */}
                    {offer.testimonials && offer.testimonials.length > 0 && (
                      <div className="pt-4 border-t border-navy/40 space-y-4">
                        <span className="text-[10px] uppercase font-bold text-silver/40 tracking-wider block">Client Feedback</span>
                        <div className="grid grid-cols-1 gap-4">
                          {offer.testimonials.map((t, idx) => (
                            <div key={idx} className="bg-obsidian/60 border border-navy/40 rounded-lg p-4 space-y-2">
                              <span className="text-[9px] uppercase font-bold tracking-widest text-blue block">Client Review</span>
                              <p className="text-[11px] text-silver/70 font-light italic leading-relaxed">
                                “{t.quote}”
                              </p>
                              <div className="pt-1">
                                <p className="text-[11px] font-semibold text-white">{t.name}</p>
                                <p className="text-[10px] text-silver/50 font-light italic">{t.role}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bonuses */}
                    <div className="bg-obsidian/40 border border-navy/40 rounded-lg p-4 space-y-1.5">
                      <span className="text-[9px] uppercase font-bold text-silver/40 tracking-widest block">BONUSES INCLUDED</span>
                      <ul className="space-y-1.5">
                        {offer.bonuses.map((bonus, idx) => (
                          <li key={idx} className="text-[11px] text-silver/70 flex items-start gap-1.5 leading-relaxed font-light">
                            <Plus className="w-2.5 h-2.5 text-blue shrink-0 mt-0.5" />
                            <span>{bonus}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Price and CTA */}
                  <div className="pt-6 mt-6 border-t border-navy/40 flex flex-col gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-silver/40 block tracking-wider">Investment</span>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xs text-silver/50 line-through font-light">{offer.originalPrice}</span>
                        <span className="text-xs text-amber-300 font-medium">Ember 50% Drop Price: <span className="text-base font-bold text-white">{offer.dropPrice}</span></span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleScrollToForm(offer.name)}
                      className="w-full bg-gradient-to-tr from-blue to-purple text-white hover:opacity-90 shadow-glow text-center text-xs font-semibold py-3 rounded-md transition-colors"
                    >
                      {offer.ctaText}
                    </button>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </section>

        {/* Section 4 — Differentiation */}
        <section className="py-20 md:py-28 px-6 sm:px-8 bg-midnight/30 border-y border-navy/40">
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="space-y-4">
              <span className="text-xs uppercase font-semibold tracking-widest text-blue">Execution Philosophy</span>
              <h2 className="text-3xl md:text-4xl font-serif text-white">
                Not a giant automation project. <br className="hidden md:inline"/>Just the part of your business that shouldn't be manual.
              </h2>
              <p className="text-silver/70 font-light text-sm md:text-base max-w-2xl">
                You don't need a six-month digital transformation project to fix a frustrating process. Most of these systems can be built around the tools you already use.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-midnight/50 p-6 rounded-lg border border-navy/50 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue">01</span>
                <h3 className="text-base font-semibold text-white uppercase">START SMALL</h3>
                <p className="text-xs text-silver/70 font-light leading-relaxed">
                  We focus on one painful process first instead of trying to rebuild your entire business.
                </p>
              </div>
              
              <div className="bg-midnight/50 p-6 rounded-lg border border-navy/50 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue">02</span>
                <h3 className="text-base font-semibold text-white uppercase">KEEP IT SIMPLE</h3>
                <p className="text-xs text-silver/70 font-light leading-relaxed">
                  The system should be easy for you and your team to understand, use and maintain.
                </p>
              </div>

              <div className="bg-midnight/50 p-6 rounded-lg border border-navy/50 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue">03</span>
                <h3 className="text-base font-semibold text-white uppercase">BUILD FOR THE OUTCOME</h3>
                <p className="text-xs text-silver/70 font-light leading-relaxed">
                  The goal isn't another piece of software. The goal is less chasing, fewer missed opportunities and less repetitive work.
                </p>
              </div>
            </div>

            <div className="pt-8 border-t border-navy/40 text-center space-y-2">
              <p className="text-sm font-medium tracking-wide text-silver">
                Forms. CRM. Email. Scheduling. Payments. AI. Automation.
              </p>
              <p className="text-xs text-silver/50 font-light">
                The tools are simply the machinery behind the result.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5 — How It Works */}
        <section className="py-20 md:py-28 px-6 sm:px-8">
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="space-y-2">
              <span className="text-xs uppercase font-semibold tracking-widest text-blue">Direct Engagement</span>
              <h2 className="text-3xl md:text-4xl font-serif text-white">
                Three steps. That's it.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-blue/10 text-blue border border-blue/30 text-xs font-semibold flex items-center justify-center">1</span>
                  <h3 className="text-sm font-semibold text-white uppercase">Tell me where the leak is.</h3>
                </div>
                <p className="text-xs text-silver/70 font-light leading-relaxed pl-10">
                  You explain what's currently happening, what's frustrating you and what you wish happened instead.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-blue/10 text-blue border border-blue/30 text-xs font-semibold flex items-center justify-center">2</span>
                  <h3 className="text-sm font-semibold text-white uppercase">I design the simplest fix.</h3>
                </div>
                <p className="text-xs text-silver/70 font-light leading-relaxed pl-10">
                  I map the process, remove unnecessary steps and choose the simplest practical way to make it work.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-blue/10 text-blue border border-blue/30 text-xs font-semibold flex items-center justify-center">3</span>
                  <h3 className="text-sm font-semibold text-white uppercase">You get a working system.</h3>
                </div>
                <p className="text-xs text-silver/70 font-light leading-relaxed pl-10">
                  I build it, test it, hand it over and show you how it works.
                </p>
              </div>
            </div>

            <div className="bg-midnight/40 rounded-lg p-6 text-center border border-navy/40 flex flex-col md:flex-row items-center justify-center gap-4 text-xs font-medium text-silver">
              <span>Problem</span>
              <ArrowRight className="w-3.5 h-3.5 text-silver/40 rotate-90 md:rotate-0" />
              <span>Process</span>
              <ArrowRight className="w-3.5 h-3.5 text-silver/40 rotate-90 md:rotate-0" />
              <span>System</span>
              <ArrowRight className="w-3.5 h-3.5 text-silver/40 rotate-90 md:rotate-0" />
              <span className="text-blue">Result</span>
            </div>

            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-silver">You don't need to become an automation expert.</p>
              <p className="text-xs text-silver/50 font-light">You just need the problem solved.</p>
            </div>
          </div>
        </section>

        {/* Section 6 — Value / Risk Reversal */}
        <section className="py-20 md:py-28 px-6 sm:px-8 bg-midnight/30 border-y border-navy/40">
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="space-y-4">
              <span className="text-xs uppercase font-semibold tracking-widest text-blue">Guaranteed Delivery</span>
              <h2 className="text-3xl md:text-4xl font-serif text-white">
                You shouldn't have to buy a mystery box.
              </h2>
              <p className="text-silver/70 font-light text-sm md:text-base">
                Before anything is built, we'll agree on exactly what process is being fixed, what the system will do and what you'll receive.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-midnight/50 p-6 rounded-lg border border-navy/50 space-y-3">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">THE CLEAR-SCOPE GUARANTEE</h3>
                <p className="text-xs text-silver/70 font-light leading-relaxed">
                  You will know exactly what is being built before work begins.
                </p>
              </div>

              <div className="bg-midnight/50 p-6 rounded-lg border border-navy/50 space-y-3">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">THE WORKING-SYSTEM GUARANTEE</h3>
                <p className="text-xs text-silver/70 font-light leading-relaxed">
                  I'll test the agreed workflow before handover so the key steps work as designed.
                </p>
              </div>

              <div className="bg-midnight/50 p-6 rounded-lg border border-navy/50 space-y-3">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">THE SUPPORT GUARANTEE</h3>
                <p className="text-xs text-silver/70 font-light leading-relaxed">
                  After delivery, you'll get a short walkthrough and a defined period for fixing implementation issues related to the agreed workflow.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7 — Final CTA */}
        <section className="py-20 md:py-24 px-6 sm:px-8 border-b border-navy/30">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-white leading-tight">
              What is one process in your business that you wish would just run itself?
            </h2>
            <p className="text-sm md:text-base text-silver/70 font-light max-w-xl mx-auto">
              Tell me what's happening today. I'll look at the process and tell you what I would fix first.
            </p>
            
            <div className="pt-4 space-y-3">
              <button
                onClick={() => handleScrollToForm()}
                className="bg-gradient-to-tr from-blue to-purple text-white hover:opacity-90 shadow-glow text-sm font-semibold px-8 py-3.5 rounded-md transition-colors"
              >
                Start With Your Workflow
              </button>
              <p className="text-xs text-silver/40 font-light">
                No long proposal. No complicated discovery process. Just tell me the problem.
              </p>
              <p className="text-[10px] text-silver/40 font-light">
                Takes about 3 minutes.
              </p>
            </div>
          </div>
        </section>

        {/* Section 8 — Intake Form */}
        <section ref={formRef} id="intake-form" className="py-20 md:py-28 px-6 sm:px-8 bg-midnight/20 flex-grow">
          <div className="max-w-xl mx-auto space-y-10">
            <div className="space-y-3 text-center">
              <span className="text-xs uppercase font-semibold tracking-widest text-blue">Intake Form</span>
              <h2 className="text-3xl font-serif text-white">Let's find the leak.</h2>
              <p className="text-xs text-silver/60 font-light">
                Tell me what currently takes too much time, causes missed opportunities or requires too much manual work.
              </p>
            </div>

            {submitSuccess ? (
              <div className="bg-blue/10 border border-blue/20 rounded-xl p-8 text-center space-y-4">
                <Check className="w-10 h-10 text-blue mx-auto" />
                <h3 className="text-lg font-serif font-bold text-white">Form Submitted</h3>
                <p className="text-sm text-silver/70 font-light leading-relaxed">
                  Got it. I'll review the workflow and get back to you with the simplest practical next step.
                </p>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="text-xs text-blue font-semibold underline mt-2"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Submission Error Box */}
                {submitError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md text-xs font-medium">
                    {submitError}
                  </div>
                )}

                {/* Your Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-silver uppercase tracking-wider block">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-md border text-xs bg-obsidian text-white focus:outline-none focus:ring-1 focus:ring-blue transition-all ${
                      formErrors.name ? 'border-red-400' : 'border-navy/50'
                    }`}
                    placeholder="John Doe"
                  />
                  {formErrors.name && <p className="text-red-400 text-[10px] font-medium">{formErrors.name}</p>}
                </div>

                {/* Business Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-silver uppercase tracking-wider block">
                    Business Name <span className="text-red-400">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-md border text-xs bg-obsidian text-white focus:outline-none focus:ring-1 focus:ring-blue transition-all ${
                      formErrors.businessName ? 'border-red-400' : 'border-navy/50'
                    }`}
                    placeholder="Example Brands"
                  />
                  {formErrors.businessName && <p className="text-red-400 text-[10px] font-medium">{formErrors.businessName}</p>}
                </div>

                {/* Business Website */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-silver uppercase tracking-wider block">
                    Business Website
                  </label>
                  <input 
                    type="url" 
                    name="businessWebsite"
                    value={formData.businessWebsite}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-md border border-navy/50 text-xs bg-obsidian text-white focus:outline-none focus:ring-1 focus:ring-blue transition-all"
                    placeholder="https://example.com"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-silver uppercase tracking-wider block">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-md border text-xs bg-obsidian text-white focus:outline-none focus:ring-1 focus:ring-blue transition-all ${
                      formErrors.email ? 'border-red-400' : 'border-navy/50'
                    }`}
                    placeholder="john@example.com"
                  />
                  {formErrors.email && <p className="text-red-400 text-[10px] font-medium">{formErrors.email}</p>}
                </div>

                {/* What type of business do you run? */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-silver uppercase tracking-wider block">
                    What type of business do you run?
                  </label>
                  <div className="relative">
                    <select 
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-md border border-navy/50 text-xs bg-obsidian text-white focus:outline-none focus:ring-1 focus:ring-blue transition-all appearance-none cursor-pointer"
                    >
                      <option value="Ecommerce">Ecommerce</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Coaching">Coaching</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Digital Product">Digital Product</option>
                      <option value="Service Business">Service Business</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-silver/50 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Which problem are you trying to fix? */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-silver uppercase tracking-wider block">
                    Which problem are you trying to fix?
                  </label>
                  <div className="relative">
                    <select 
                      value={selectedProblem}
                      onChange={(e) => setSelectedProblem(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-md border border-navy/50 text-xs bg-obsidian text-white focus:outline-none focus:ring-1 focus:ring-blue transition-all appearance-none cursor-pointer"
                    >
                      <option value="Lead Follow-Up">Lead Follow-Up</option>
                      <option value="Client Onboarding">Client Onboarding</option>
                      <option value="Sales Funnel">Sales Funnel</option>
                      <option value="Lost Sales / Abandoned Checkout">Lost Sales / Abandoned Checkout</option>
                      <option value="Repetitive Admin">Repetitive Admin</option>
                      <option value="Something Else">Something Else</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-silver/50 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Tell me what currently happens */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-silver uppercase tracking-wider block">
                    Tell me what currently happens <span className="text-red-400">*</span>
                  </label>
                  <textarea 
                    name="currentHappens"
                    rows={4}
                    value={formData.currentHappens}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-md border text-xs bg-obsidian text-white focus:outline-none focus:ring-1 focus:ring-blue transition-all ${
                      formErrors.currentHappens ? 'border-red-400' : 'border-navy/50'
                    }`}
                    placeholder="Describe your current manual steps..."
                  />
                  <span className="text-[10px] text-silver/40 font-light block mt-0.5">
                    Don't worry about explaining it perfectly. Just describe what you currently do manually.
                  </span>
                  {formErrors.currentHappens && <p className="text-red-400 text-[10px] font-medium">{formErrors.currentHappens}</p>}
                </div>

                {/* What would you like to happen instead */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-silver uppercase tracking-wider block">
                    What would you like to happen instead? <span className="text-red-400">*</span>
                  </label>
                  <textarea 
                    name="desiredHappens"
                    rows={4}
                    value={formData.desiredHappens}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-md border text-xs bg-obsidian text-white focus:outline-none focus:ring-1 focus:ring-blue transition-all ${
                      formErrors.desiredHappens ? 'border-red-400' : 'border-navy/50'
                    }`}
                    placeholder="Describe your ideal automatic workflow outcome..."
                  />
                  {formErrors.desiredHappens && <p className="text-red-400 text-[10px] font-medium">{formErrors.desiredHappens}</p>}
                </div>

                {/* Which tools are you currently using */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-silver uppercase tracking-wider block">
                    Which tools are you currently using?
                  </label>
                  <input 
                    type="text" 
                    name="tools"
                    value={formData.tools}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-md border border-navy/50 text-xs bg-obsidian text-white focus:outline-none focus:ring-1 focus:ring-blue transition-all"
                    placeholder="Shopify, WordPress, Calendly, Stripe, HubSpot..."
                  />
                  <span className="text-[10px] text-silver/40 font-light block mt-0.5">
                    Examples: Shopify, WordPress, HubSpot, Gmail, Calendly, Stripe, Airtable, Zapier, Make, etc.
                  </span>
                </div>

                {/* How soon would you like this fixed? */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-silver uppercase tracking-wider block">
                    How soon would you like this fixed?
                  </label>
                  <div className="relative">
                    <select 
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-md border border-navy/50 text-xs bg-obsidian text-white focus:outline-none focus:ring-1 focus:ring-blue transition-all appearance-none cursor-pointer"
                    >
                      <option value="ASAP">ASAP</option>
                      <option value="Within 2 weeks">Within 2 weeks</option>
                      <option value="This month">This month</option>
                      <option value="Just exploring">Just exploring</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-silver/50 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-tr from-blue to-purple text-white hover:opacity-90 disabled:opacity-50 text-sm font-semibold py-3.5 rounded-md shadow-glow transition-all duration-300 flex items-center justify-center gap-2 mt-4"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Request...
                    </>
                  ) : 'Show Me What To Fix'}
                </button>

              </form>
            )}
          </div>
        </section>
      </Layout>
    </>
  );
};

export default BusinessWorkflowFixes;
