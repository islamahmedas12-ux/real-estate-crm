import { z } from 'zod';

export const leadFormSchema = z.object({
  clientId: z.string().min(1, 'Client is required').trim(),
  propertyId: z.string().optional(),
  source: z
    .enum(['REFERRAL', 'WEBSITE', 'SOCIAL_MEDIA', 'WALK_IN', 'PHONE', 'ADVERTISEMENT', 'OTHER'])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  budget: z.string().optional(),
  notes: z.string().optional(),
  nextFollowUp: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

export const leadActivitySchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'VIEWING', 'FOLLOW_UP', 'STATUS_CHANGE']),
  description: z.string().min(1, 'Description is required').trim(),
});

export type LeadActivityFormData = z.infer<typeof leadActivitySchema>;

export const quickLogSchema = z.object({
  type: z.enum(['CALL', 'MEETING', 'NOTE']),
  description: z.string().min(1, 'Description is required').trim(),
});

export type QuickLogFormData = z.infer<typeof quickLogSchema>;

export const clientFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address')
    .optional()
    .or(z.literal('')),
  nationalId: z.string().optional(),
  type: z.enum(['BUYER', 'SELLER', 'TENANT', 'LANDLORD', 'INVESTOR']),
  source: z.enum([
    'REFERRAL',
    'WEBSITE',
    'SOCIAL_MEDIA',
    'WALK_IN',
    'PHONE',
    'ADVERTISEMENT',
    'OTHER',
  ]),
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;
