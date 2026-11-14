import { z } from 'zod';
import { safeExternalUrl } from '@/shared/lib/navigation';

/**
 * Shared validation schemas for consistent validation across the application
 * Following the DRY principle to eliminate duplicate validation logic
 */

// Email validation
export const emailSchema = z.string().email('auth.error.invalidEmail');

// Password validation (minimum 6 characters)
export const passwordSchema = z.string().min(6, 'auth.error.passwordMinLength');

// Username validation (minimum 3 characters)
export const usernameSchema = z.string().min(3, 'auth.error.usernameMinLength');

// Optional username (allows empty string or meets minimum requirements)
export const optionalUsernameSchema = usernameSchema.optional().or(z.literal(''));

/**
 * Password confirmation refinement
 * Use this to validate that password and confirmPassword match
 * 
 * @example
 * const schema = z.object({
 *   password: passwordSchema,
 *   confirmPassword: passwordSchema,
 * }).refine(...passwordMatchRefinement);
 */
export const passwordMatchRefinement = {
  check: (data: { password: string; confirmPassword: string }) => 
    data.password === data.confirmPassword,
  message: 'auth.resetPassword.error.passwordMismatch',
  path: ['confirmPassword'] as const,
};

/**
 * Helper to create a password confirmation schema
 * Automatically includes password match validation
 */
export const createPasswordConfirmationSchema = (messageKey = 'auth.resetPassword.error.passwordMismatch') =>
  z.object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  }).refine(
    (data) => data.password === data.confirmPassword,
    {
      message: messageKey,
      path: ['confirmPassword'],
    }
  );

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, 'validation.required') });
export const signInFormSchema = loginSchema.extend({ name: z.string() });
export const signupSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(200, 'validation.tooLong'),
  email: emailSchema,
  password: passwordSchema,
});
export const resetRequestSchema = z.object({ email: emailSchema });
export const profileSchema = signupSchema.omit({ password: true });

const optionalUrl = z.string().trim().refine(
  (value) => !value || !!safeExternalUrl(value),
  'validation.url',
);
export const contentSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(500, 'validation.tooLong'),
  slug: z.string().trim().min(1, 'validation.required').max(500, 'validation.tooLong')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'validation.slug'),
  language: z.string().trim().min(2, 'validation.required').max(16, 'validation.tooLong'),
  description: z.string().max(100000, 'validation.tooLong'),
  summary: z.string().max(5000, 'validation.tooLong'),
  course_id: z.union([z.uuid(), z.literal('')]),
  learning_object_id: z.union([z.uuid(), z.literal('')]),
  object_type: z.string().trim().min(1, 'validation.required').max(80, 'validation.tooLong'),
  source_url: optionalUrl,
});
export type ContentFormValues = z.infer<typeof contentSchema>;

export const noteSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(160, 'validation.tooLong'),
  tags: z.string().max(400, 'validation.tooLong'),
  body: z.string().max(8000, 'validation.tooLong'),
});
export type NoteFormValues = z.infer<typeof noteSchema>;
