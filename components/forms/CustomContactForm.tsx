import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { contactFormSchema, ContactFormValues } from './schema';
import { getAttributionData } from '../../utils/attribution';
import { 
  CheckCircle2, 
  ChevronRight, 
  Calendar, 
  MessageSquare, 
  User, 
  Briefcase, 
  Mail, 
  Building2, 
  Phone,
  ArrowRight,
  Globe,
  Users
} from 'lucide-react';
import Cal, { getCalApi } from '@calcom/embed-react';
import { countriesList } from '../../utils/countries';

const SERVICES = [
  'Free System clarity audit',
  'Implementation Partnership',
  'Operational Diagnostic Brief',
  'Automation & Workflow Design',
  'Training'
];

const POSITIONS = [
  'CEO', 'Founder', 'Managing Director', 'COO', 'CTO', 'CIO', 
  'Operations Manager', 'Project Manager', 'Department Head', 'Team Lead', 'Other'
];

const CustomContactForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<ContactFormValues | null>(null);
  const submittedDataRef = useRef<ContactFormValues | null>(null);

  useEffect(() => {
    submittedDataRef.current = submittedData;
  }, [submittedData]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      service: '',
      newsletterOptIn: false
    }
  });

  const selectedService = watch('service') || '';

  const saveLead = async (data: any, bookingTime?: string) => {
    try {
      const attribution = getAttributionData();
      
      // 1. Save to Airtable Leads using save-contact
      const airtableResponse = await fetch('/api/save-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tableName: 'Leads',
          fields: {
            "Created Date": new Date().toISOString(),
            "Lead Type": "Service Inquiry",
            "First Name": data.firstName,
            "Last Name": data.lastName,
            "Email": data.email,
            "Phone Number": data.phone || "",
            "Company Name": data.companyName || "",
            "Position": data.position || "",
            "Country": data.country || "",
            "Company Size": data.companySize || "",
            "Service Selected": data.service,
            "Business Goal": data.businessChallenge || "",
            "Newsletter Opt-In": data.newsletterOptIn || false,
            "Booking Time": bookingTime || "",
            "Lead Source": attribution.lead_source || "direct",
            "Landing Page": attribution.landing_page || "",
            "UTM Source": attribution.utm_source || "",
            "UTM Medium": attribution.utm_medium || "",
            "UTM Campaign": attribution.utm_campaign || "",
            "Referrer": attribution.referrer || "",
            "Status": "New"
          }
        })
      });

      if (!airtableResponse.ok) {
        const errData = await airtableResponse.json();
        console.error('Airtable save error:', errData);
      }

      // 2. Add to Loops using subscribe
      const serviceChosen = (data.service || '').split(',')[0].trim();
      try {
        await fetch('/api/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            userGroup: serviceChosen,
            mailingLists: {},
          })
        });
      } catch (loopsErr) {
        console.error('Loops subscribe error:', loopsErr);
      }
    } catch (err) {
      console.error('Submission error:', err);
    }
  };

  useEffect(() => {
    (async function () {
      const cal = await getCalApi({"namespace": "30min"});
      cal("on", {
        action: "bookingSuccessful",
        callback: (e) => {
          const bookingTime = e.detail?.data?.date || new Date().toISOString();
          
          if (submittedDataRef.current) {
            saveLead(submittedDataRef.current, bookingTime);
          }
          
          setShowCalendar(false);
          setIsSuccess(true);
        }
      });
      cal("ui", {"styles":{"branding":{"brandColor":"#3c75a5"}},"hideEventTypeDetails":false,"layout":"month_view"});
    })();
  }, []);

  const selectService = (service: string) => {
    setValue('service', service, { shouldValidate: true });
  };

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    setSubmittedData(data);
    setShowCalendar(true);
    setIsSubmitting(false);
  };

  // The calendar screen
  if (showCalendar && submittedData) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-midnight/60 backdrop-blur-xl border border-navy/80 p-8 md:p-12 rounded-[2rem] shadow-glow max-w-4xl mx-auto w-full text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -mt-16 -ml-16 w-32 h-32 bg-blue/20 rounded-full blur-3xl pointer-events-none"></div>
        <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">
          Select a Time
        </h2>
        <p className="text-xl text-silver mb-8">Please choose a convenient time for our session.</p>
        
        <div className="w-full bg-white rounded-[2rem] overflow-hidden min-h-[600px] mb-8">
          <Cal 
            namespace="30min"
            calLink="joshua-omole-d9c2vi/30min"
            style={{ width: "100%", height: "100%", overflow: "scroll" }}
            config={{ 
              layout: "month_view",
              name: `${submittedData.firstName} ${submittedData.lastName}`.trim(),
              email: submittedData.email
            }}
          />
        </div>

        <button 
          onClick={() => {
            if (submittedData) {
              saveLead(submittedData);
            }
            setShowCalendar(false);
            setIsSuccess(true);
          }}
          className="text-silver hover:text-white transition-colors"
        >
          Skip / I've already booked my time
        </button>
      </motion.div>
    );
  }

  // The success screen
  if (isSuccess && submittedData) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-midnight/60 backdrop-blur-xl border border-navy/80 p-8 md:p-12 rounded-[2rem] shadow-glow max-w-3xl mx-auto w-full text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -mt-16 -ml-16 w-32 h-32 bg-blue/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="w-20 h-20 bg-blue/10 border border-blue/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
          <CheckCircle2 className="w-10 h-10 text-blue" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">
          Thank You, {submittedData.firstName}
        </h2>
        <p className="text-xl text-silver mb-10">We've received your request.</p>
        
        <div className="bg-obsidian/80 border border-navy/50 rounded-2xl p-6 text-left mb-10 mx-auto max-w-xl">
          <div className="mb-4">
            <span className="text-sm text-silver/70 font-mono uppercase tracking-wider block mb-1">Service Selected</span>
            <div className="text-white font-medium">
              {submittedData.service || 'General Consultation'}
            </div>
          </div>
          <div className="mb-4">
            <span className="text-sm text-silver/70 font-mono uppercase tracking-wider block mb-1">Appointment</span>
            <div className="text-white font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue" />
              <span>Confirmed via Cal.com</span>
            </div>
          </div>
          <div>
             <span className="text-sm text-silver/70 font-mono uppercase tracking-wider block mb-1">Confirmation Email</span>
             <div className="text-white font-medium">{submittedData.email}</div>
          </div>
        </div>
        
        <div className="mb-10 text-left max-w-xl mx-auto">
          <h4 className="text-white font-serif text-xl mb-4">Next Steps:</h4>
          <ul className="space-y-3 text-silver">
            <li className="flex gap-3"><span className="text-blue">1.</span> Check your inbox for confirmation.</li>
            <li className="flex gap-3"><span className="text-blue">2.</span> Add the appointment to your calendar (sent via email).</li>
            <li className="flex gap-3"><span className="text-blue">3.</span> Prepare any relevant questions for our session.</li>
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a href="/" className="w-full sm:w-auto px-8 py-4 bg-navy/40 border border-navy text-white rounded-xl font-medium hover:bg-navy/60 transition-all">
            Return Home
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Trust Elements */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
         {[
           'Business-focused conversations',
           'Practical recommendations',
           'No obligation',
           'Tailored to your goals'
         ].map((trust, idx) => (
           <div key={idx} className="bg-midnight/40 border border-navy/30 rounded-xl p-3 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue shrink-0 mt-0.5" />
              <span className="text-xs text-silver/90 font-medium">{trust}</span>
           </div>
         ))}
      </div>

      <motion.form 
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Step 1: Personal Information */}
        <section className="bg-midnight/30 border border-navy/40 rounded-[2rem] p-6 md:p-10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue/50 to-purple/50"></div>
          <h2 className="text-2xl font-serif text-white mb-6 flex items-center gap-3">
            <User className="text-blue/70 w-6 h-6" />
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-silver font-medium ml-1">First Name *</label>
              <input 
                {...register('firstName')} 
                className="w-full bg-obsidian/60 border border-navy text-white px-5 py-4 rounded-xl focus:outline-none focus:border-blue focus:ring-1 focus:ring-blue transition-all"
                placeholder="First Name"
              />
              {errors.firstName && <p className="text-red-400 text-xs ml-1">{errors.firstName.message}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-silver font-medium ml-1">Last Name *</label>
              <input 
                {...register('lastName')} 
                className="w-full bg-obsidian/60 border border-navy text-white px-5 py-4 rounded-xl focus:outline-none focus:border-blue focus:ring-1 focus:ring-blue transition-all"
                placeholder="Last Name"
              />
              {errors.lastName && <p className="text-red-400 text-xs ml-1">{errors.lastName.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-silver font-medium ml-1">Business Email *</label>
              <div className="relative">
                 <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-navy group-focus-within:text-blue transition-colors pointer-events-none" />
                 <input 
                   {...register('email')} 
                   className="w-full bg-obsidian/60 border border-navy text-white pl-12 pr-5 py-4 rounded-xl focus:outline-none focus:border-blue focus:ring-1 focus:ring-blue transition-all"
                   placeholder="name@company.com"
                 />
              </div>
              {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-silver font-medium ml-1">Phone Number (optional)</label>
              <div className="relative">
                 <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-navy pointer-events-none" />
                 <input 
                   {...register('phone')} 
                   className="w-full bg-obsidian/60 border border-navy text-white pl-12 pr-5 py-4 rounded-xl focus:outline-none focus:border-blue transition-all"
                   placeholder="+1 (555) 000-0000"
                 />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-silver font-medium ml-1">Company Name *</label>
              <div className="relative">
                 <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-navy pointer-events-none" />
                 <input 
                   {...register('companyName')} 
                   className="w-full bg-obsidian/60 border border-navy text-white pl-12 pr-5 py-4 rounded-xl focus:outline-none focus:border-blue transition-all"
                   placeholder="Your Company Ltd."
                 />
              </div>
              {errors.companyName && <p className="text-red-400 text-xs ml-1">{errors.companyName.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-silver font-medium ml-1">Country *</label>
              <div className="relative">
                 <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-navy pointer-events-none" />
                 <input 
                   {...register('country')} 
                   list="countries-list"
                   className="w-full bg-obsidian/60 border border-navy text-white pl-12 pr-5 py-4 rounded-xl focus:outline-none focus:border-blue transition-all"
                   placeholder="Country Your company is located"
                   autoComplete="off"
                 />
                 <datalist id="countries-list">
                   {countriesList.map(country => (
                     <option key={country} value={country} />
                   ))}
                 </datalist>
              </div>
              {errors.country && <p className="text-red-400 text-xs ml-1">{errors.country.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-silver font-medium ml-1">Company Size *</label>
              <div className="relative">
                 <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-navy pointer-events-none" />
                 <select 
                   {...register('companySize')} 
                   className="w-full bg-obsidian/60 border border-navy text-white pl-12 pr-5 py-4 rounded-xl focus:outline-none focus:border-blue transition-all appearance-none"
                 >
                   <option value="" disabled>Select company size</option>
                   <option value="1-15 employees">1-15 employees</option>
                   <option value="16-50 employees">16-50 employees</option>
                   <option value="50+ employees">50+ employees</option>
                 </select>
                 <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                   <ChevronRight className="w-5 h-5 text-navy rotate-90" />
                 </div>
              </div>
              {errors.companySize && <p className="text-red-400 text-xs ml-1">{errors.companySize.message}</p>}
            </div>
          </div>
        </section>

        {/* Step 2: Service Selection */}
        <section className="bg-midnight/30 border border-navy/40 rounded-[2rem] p-6 md:p-10 shadow-lg">
          <h2 className="text-2xl font-serif text-white mb-2">What would you like help with?</h2>
          <p className="text-silver/80 text-sm mb-6">Select the primary service you require.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {SERVICES.map((service) => {
               const isSelected = selectedService === service;
               
               return (
                 <motion.button
                   type="button"
                   key={service}
                   whileHover={{ y: -2 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => selectService(service)}
                   className={`
                     relative p-6 rounded-2xl border text-left transition-all duration-300 overflow-hidden
                     ${isSelected 
                       ? 'bg-blue/10 border-blue shadow-[0_0_15px_rgba(60,117,165,0.2)]' 
                       : 'bg-obsidian/60 border-navy hover:bg-midnight hover:border-blue/30'}
                   `}
                 >
                   <div className="absolute top-0 right-0 w-16 h-16 bg-blue/10 rounded-bl-full blur-xl -mr-4 -mt-4 opacity-0 transition-opacity" style={{ opacity: isSelected ? 1 : 0 }}></div>
                   
                   <div className="flex items-start justify-between gap-4">
                     <span className={`font-medium ${isSelected ? 'text-white' : 'text-silver'}`}>{service}</span>
                     <div className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue border-blue text-white' : 'border-navy/80'}`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                     </div>
                   </div>
                 </motion.button>
               );
             })}
          </div>
          {errors.service && <p className="text-red-400 text-xs mt-4">{errors.service.message}</p>}
        </section>

        {/* Step 3: Role Selection */}
        <section className="bg-midnight/30 border border-navy/40 rounded-[2rem] p-6 md:p-10 shadow-lg">
          <h2 className="text-2xl font-serif text-white mb-6 flex items-center gap-3">
             <Briefcase className="text-purple/70 w-6 h-6" />
             Your Position
          </h2>
          <div className="max-w-md">
             <label className="text-sm text-silver font-medium ml-1 block mb-2">Role *</label>
             <div className="relative">
                <select 
                  {...register('position')} 
                  className="w-full bg-obsidian/60 border border-navy text-white px-5 py-4 rounded-xl focus:outline-none focus:border-blue transition-all appearance-none"
                >
                  <option value="">Select your position...</option>
                  {POSITIONS.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight className="w-5 h-5 text-silver rotate-90" />
                </div>
             </div>
             {errors.position && <p className="text-red-400 text-xs mt-2 ml-1">{errors.position.message}</p>}
          </div>
        </section>

        {/* Step 4: Business Challenge */}
        <section className="bg-midnight/30 border border-navy/40 rounded-[2rem] p-6 md:p-10 shadow-lg">
          <h2 className="text-2xl font-serif text-white mb-6 flex items-center gap-3">
             <MessageSquare className="text-blue/70 w-6 h-6" />
             Tell me a little about your goals or challenges
          </h2>
          <div>
            <textarea 
              {...register('businessChallenge')}
              rows={5}
              className="w-full bg-obsidian/60 border border-navy text-white px-5 py-4 rounded-xl focus:outline-none focus:border-blue focus:ring-1 focus:ring-blue transition-all resize-none"
              placeholder="What challenge are you trying to solve? What outcome are you hoping to achieve?"
            />
            {errors.businessChallenge && <p className="text-red-400 text-xs mt-2 ml-1">{errors.businessChallenge.message}</p>}
          </div>
        </section>

        {/* Step 5: Newsletter Opt-In */}
        <section className="bg-gradient-to-r from-blue/10 to-obsidian border border-blue/20 rounded-[2rem] p-6 md:p-8">
           <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative flex items-start pt-1">
                 <input 
                   type="checkbox" 
                   {...register('newsletterOptIn')}
                   className="w-6 h-6 rounded-md border-navy bg-obsidian text-blue focus:ring-blue focus:ring-offset-obsidian cursor-pointer"
                 />
              </div>
              <div>
                 <span className="text-white font-medium block mb-1">Stay updated with actionable insights</span>
                 <p className="text-silver/80 text-sm leading-relaxed">
                   I'd also like to receive practical insights on AI, technology, systems thinking, and smarter business operations.
                 </p>
              </div>
           </label>
        </section>

        {/* Submit & Cal.com */}
        <section className="pt-6 pb-10">
          <div className="flex flex-col items-center max-w-md mx-auto">
             <button
               type="submit"
               disabled={isSubmitting}
               className="w-full py-5 px-8 rounded-2xl bg-blue text-white font-medium text-lg flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(60,117,165,0.4)] hover:shadow-[0_0_30px_rgba(60,117,165,0.6)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none"
             >
               {isSubmitting ? (
                 <>
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   Scheduling...
                 </>
               ) : (
                 <>
                   Schedule My Session
                   <ArrowRight className="w-5 h-5" />
                 </>
               )}
             </button>
             <p className="text-silver/60 text-xs mt-4 text-center">
               By proceeding, you will submit your inquiry and be prompted to pick a time slot.
             </p>
          </div>
        </section>

      </motion.form>
    </div>
  );
};

export default CustomContactForm;
