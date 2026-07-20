import { z } from 'zod';

export const contactFormSchema = z.object({
  firstName: z.string().min(1, 'First Name is required'),
  lastName: z.string().min(1, 'Last Name is required'),
  email: z.string().email('Please enter a valid business email'),
  phone: z.string().optional(),
  companyName: z.string().min(1, 'Company Name is required'),
  services: z
    .array(z.string())
    .max(2, 'You can select a maximum of two services'),
  position: z.string().min(1, 'Please select your position'),
  country: z.string().min(1, 'Please select your country'),
  companySize: z.string().min(1, 'Please select company size'),
  businessChallenge: z.string().optional(),
  newsletterOptIn: z.boolean().default(false),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
