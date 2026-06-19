import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Mail, Loader2, ArrowRight } from 'lucide-react';
import { Resource } from '../../types';
import Button from '../Button';
import { getAttributionData } from '../../utils/attribution';

interface LeadCaptureModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const formSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
});

type FormData = z.infer<typeof formSchema>;

const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({ resource, isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    if (!resource) return;
    
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const attribution = getAttributionData();
      // Simulate API call to backend
      // POST /api/resource-access
      // Expected payload: first_name, last_name, email, resource_id, resource_title, resource_category, lead_source
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        resource_id: resource.id,
        resource_title: resource.title,
        resource_category: resource.category,
        ...attribution
      };
      
      const response = await fetch('/api/resource-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (!result.success) {
        setErrorMsg(result.message || 'An error occurred. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      reset();
      onSuccess();
    } catch (error) {
      console.error(error);
      setErrorMsg('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !resource) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 p-safe-area">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-obsidian/90 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative z-10 w-full max-w-lg bg-midnight border border-navy shadow-glow rounded-[2.5rem] overflow-hidden pointer-events-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-2 text-silver md:hover:text-white bg-obsidian rounded-full transition-colors border border-navy"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8 md:p-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue/20 to-purple/20 flex items-center justify-center mb-6 border border-white/10 shadow-inner">
              <Mail className="w-7 h-7 text-white" />
            </div>
            
            <h3 className="text-2xl md:text-3xl font-serif text-white mb-2">Get Instant Access</h3>
            <p className="text-silver mb-8 leading-relaxed">
              Enter your details to access <span className="text-white font-medium">"{resource.title}"</span>. We'll send it directly to your inbox.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="text-sm font-medium text-silver pl-2">First Name</label>
                  <input
                    {...register('firstName')}
                    type="text"
                    id="firstName"
                    className="w-full bg-obsidian border border-navy rounded-2xl px-5 py-3.5 text-white placeholder-silver/50 focus:outline-none focus:border-blue transition-colors shadow-inner"
                    placeholder="Jane"
                  />
                  {errors.firstName && (
                    <p className="text-red-400 text-xs pl-2">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="lastName" className="text-sm font-medium text-silver pl-2">Last Name</label>
                  <input
                    {...register('lastName')}
                    type="text"
                    id="lastName"
                    className="w-full bg-obsidian border border-navy rounded-2xl px-5 py-3.5 text-white placeholder-silver/50 focus:outline-none focus:border-blue transition-colors shadow-inner"
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-xs pl-2">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-silver pl-2">Email Address</label>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className="w-full bg-obsidian border border-navy rounded-2xl px-5 py-3.5 text-white placeholder-silver/50 focus:outline-none focus:border-blue transition-colors shadow-inner"
                  placeholder="jane@company.com"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs pl-2">{errors.email.message}</p>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {errorMsg}
                </div>
              )}

              <div className="pt-2">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full"
                  {...(isSubmitting ? { disabled: true } : {})}
                >
                  {isSubmitting ? (
                    <>Processing <Loader2 className="ml-2 w-5 h-5 animate-spin" /></>
                  ) : (
                    <>Send Me The Resource <ArrowRight className="ml-2 w-5 h-5" /></>
                  )}
                </Button>
              </div>
              <p className="text-xs text-silver/60 text-center mt-4">
                By downloading, you agree to receive occasional updates. We will never share your email.
              </p>
            </form>
          </div>
          
          {/* Bottom decorative bar */}
          <div className="h-2 w-full bg-neon-gradient"></div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LeadCaptureModal;
