import { z } from 'zod';

export const propertySchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  description: z.string().optional(),
  type: z.enum([
    'APARTMENT',
    'VILLA',
    'OFFICE',
    'SHOP',
    'LAND',
    'BUILDING',
    'CHALET',
    'STUDIO',
    'DUPLEX',
    'PENTHOUSE',
  ]),
  price: z.string().min(1, 'Price is required'),
  area: z.string().min(1, 'Area is required'),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  floor: z.number().optional(),
  address: z.string().min(1, 'Address is required').trim(),
  city: z.string().min(1, 'City is required').trim(),
  region: z.string().min(1, 'Region is required').trim(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  features: z.array(z.string()).optional(),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

export const clientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
  nationalId: z.string().optional(),
  type: z.enum(['BUYER', 'SELLER', 'RENTER', 'TENANT', 'BOTH']),
  source: z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL', 'ADVERTISEMENT', 'WALK_IN', 'CALL', 'OTHER']),
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

export const leadSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  propertyId: z.string().optional(),
  status: z
    .enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  source: z.string().optional(),
  budget: z.string().optional(),
  notes: z.string().optional(),
  nextFollowUp: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;
