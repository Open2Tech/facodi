import { describe, expect, it } from 'vitest';
import { AuthApiError } from '@supabase/supabase-js';
import { authErrorKey } from '@/entities/auth/authErrors';

describe('authErrorKey', () => {
  it('translates Supabase Auth codes instead of exposing the English API message', () => {
    expect(authErrorKey(new AuthApiError('New password should be different from the old password.', 422, 'same_password'))).toBe('auth.error.samePassword');
    expect(authErrorKey(new AuthApiError('Email rate limit exceeded', 429, undefined))).toBe('auth.error.rateLimited');
  });

  it('keeps app-level keys and hides unknown failures behind the generic message', () => {
    expect(authErrorKey(new Error('auth.error.sessionRequired'))).toBe('auth.error.sessionRequired');
    expect(authErrorKey(new Error('Database error saving new user'))).toBe('common.error');
  });
});
