import { useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { PREFERENCE_KEYS, readPreference, writePreference } from '@/shared/lib/preferenceStorage';
import { ThemeContext, type Theme } from './theme';

const initialTheme = (): Theme => readPreference(PREFERENCE_KEYS.theme) === 'dark' ? 'dark' : 'light';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    root.style.colorScheme = theme;
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    writePreference(PREFERENCE_KEYS.theme, next);
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
