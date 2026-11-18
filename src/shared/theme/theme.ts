import { createContext, useContext } from 'react';
import { PREFERENCE_KEYS, readPreference } from '@/shared/lib/preferenceStorage';

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

/** A saved choice wins; otherwise the first visit follows the device setting (light when it is unknown). */
export function initialTheme(): Theme {
  const saved = readPreference(PREFERENCE_KEYS.theme);
  if (saved === 'dark' || saved === 'light') return saved;
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}
