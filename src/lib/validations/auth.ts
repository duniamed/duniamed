import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
  rememberMe: z.boolean().optional(),
});

export const signupSchema = z.object({
  role: z.enum(['patient', 'specialist', 'clinic_admin'], {
    required_error: 'Please select a role',
  }),
  // Specialist subtype
  specialistType: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  
  // Basic info
  firstName: z.string()
    .trim()
    .min(1, { message: 'First name is required' })
    .max(100, { message: 'First name must be less than 100 characters' }),
  lastName: z.string()
    .trim()
    .min(1, { message: 'Last name is required' })
    .max(100, { message: 'Last name must be less than 100 characters' }),
  email: z.string()
    .trim()
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),
  
  // Jurisdiction
  jurisdiction: z.enum(['EU_UK', 'US', 'CA', 'BR', 'IN', 'AU'], {
    required_error: 'Please select your jurisdiction',
  }),
  
  // License information (for specialists)
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),
  registrationNumber: z.string().optional(),
  
  // Clinic information
  clinicName: z.string().optional(),
  clinicType: z.string().optional(),
  clinicSpecialties: z.array(z.string()).optional(),
  facilityId: z.string().optional(),
  responsibleDirector: z.string().optional(),
  
  // Consents
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
  dataProcessingConsent: z.boolean().refine((val) => val === true, {
    message: 'You must consent to data processing',
  }),
  gdprArticle9Basis: z.string().optional(),
  hipaaAcknowledgment: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const profileSchema = z.object({
  firstName: z.string()
    .trim()
    .min(1, { message: 'First name is required' })
    .max(100, { message: 'First name must be less than 100 characters' }),
  lastName: z.string()
    .trim()
    .min(1, { message: 'Last name is required' })
    .max(100, { message: 'Last name must be less than 100 characters' }),
  phone: z.string().trim().optional(),
  dateOfBirth: z.string().optional(),
  languagePreference: z.string().optional(),
  timezone: z.string().optional(),
});

export const passwordChangeSchema = z.object({
  newPassword: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
