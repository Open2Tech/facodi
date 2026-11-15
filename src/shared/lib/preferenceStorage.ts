import { useSyncExternalStore } from 'react';

/**
 * Interface preferences (language, theme) live in sessionStorage by default and are only
 * persisted to localStorage after the visitor opts in, as required by art. 5 of Lei 41/2004
 * (see the cookie policy). The opt-in flag itself records that choice.
 */
export const PREFERENCE_KEYS = { language: 'i18nextLng', theme: 'facodi-theme' } as const;
export const REMEMBER_PREFERENCES_KEY = 'facodi-remember-preferences';

export type PreferenceKey = typeof PREFERENCE_KEYS[keyof typeof PREFERENCE_KEYS];

const keys = Object.values(PREFERENCE_KEYS);
const listeners = new Set<() => void>();

// Storage access throws when the browser blocks site data; preferences then last for the page only.
function attempt<T>(action: () => T, fallback: T): T {
  try {
    return action();
  } catch {
    return fallback;
  }
}

export function isRememberingPreferences() {
  return attempt(() => localStorage.getItem(REMEMBER_PREFERENCES_KEY) === 'true', false);
}

/** Moves a value persisted without consent (before the opt-in existed) into this session. */
function moveToSession(key: PreferenceKey) {
  attempt(() => {
    const persisted = localStorage.getItem(key);
    if (persisted === null) return;
    if (sessionStorage.getItem(key) === null) sessionStorage.setItem(key, persisted);
    localStorage.removeItem(key);
  }, undefined);
}

export function readPreference(key: PreferenceKey): string | null {
  if (isRememberingPreferences()) return attempt(() => localStorage.getItem(key) ?? sessionStorage.getItem(key), null);
  moveToSession(key);
  return attempt(() => sessionStorage.getItem(key), null);
}

export function writePreference(key: PreferenceKey, value: string) {
  attempt(() => sessionStorage.setItem(key, value), undefined);
  if (isRememberingPreferences()) attempt(() => localStorage.setItem(key, value), undefined);
}

export function setRememberPreferences(remember: boolean) {
  if (remember) {
    attempt(() => {
      localStorage.setItem(REMEMBER_PREFERENCES_KEY, 'true');
      for (const key of keys) {
        const value = sessionStorage.getItem(key);
        if (value !== null) localStorage.setItem(key, value);
      }
    }, undefined);
  } else {
    for (const key of keys) moveToSession(key);
    attempt(() => localStorage.removeItem(REMEMBER_PREFERENCES_KEY), undefined);
  }
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === REMEMBER_PREFERENCES_KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useRememberPreferences() {
  return useSyncExternalStore(subscribe, isRememberingPreferences, () => false);
}
