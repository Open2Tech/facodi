import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PREFERENCE_KEYS, writePreference } from '@/shared/lib/preferenceStorage';
import { initialTheme } from './theme';

const prefersDark = (matches: boolean) => vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: query.includes('dark') && matches, media: query })));

describe('initial theme', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('follows the device setting on a first visit', () => {
    prefersDark(true);
    expect(initialTheme()).toBe('dark');
    prefersDark(false);
    expect(initialTheme()).toBe('light');
  });

  it('keeps the visitor choice over the device setting', () => {
    prefersDark(true);
    writePreference(PREFERENCE_KEYS.theme, 'light');
    expect(initialTheme()).toBe('light');
  });

  it('falls back to light when the browser cannot tell', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(initialTheme()).toBe('light');
  });
});
