import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREFERENCE_KEYS, REMEMBER_PREFERENCES_KEY, isRememberingPreferences, readPreference, setRememberPreferences, writePreference } from './preferenceStorage';

const { language, theme } = PREFERENCE_KEYS;

describe('preferenceStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('degrades safely when the browser refuses storage access', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    const remove = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    try {
      expect(readPreference(language)).toBeNull();
      expect(isRememberingPreferences()).toBe(false);
      expect(() => writePreference(theme, 'dark')).not.toThrow();
      expect(() => setRememberPreferences(true)).not.toThrow();
      expect(() => setRememberPreferences(false)).not.toThrow();
    } finally {
      get.mockRestore();
      set.mockRestore();
      remove.mockRestore();
    }
  });

  it('keeps choices in the session until the visitor opts in', () => {
    writePreference(theme, 'dark');
    expect(sessionStorage.getItem(theme)).toBe('dark');
    expect(localStorage.length).toBe(0);
    expect(readPreference(theme)).toBe('dark');
  });

  it('moves values persisted without consent into the session', () => {
    localStorage.setItem(language, 'fr');
    expect(readPreference(language)).toBe('fr');
    expect(localStorage.getItem(language)).toBeNull();
    expect(sessionStorage.getItem(language)).toBe('fr');
  });

  it('persists after opting in and deletes persisted values when consent is withdrawn', () => {
    writePreference(language, 'es');
    setRememberPreferences(true);
    expect(isRememberingPreferences()).toBe(true);
    expect(localStorage.getItem(language)).toBe('es');

    writePreference(theme, 'dark');
    sessionStorage.clear();
    expect(readPreference(theme)).toBe('dark');

    setRememberPreferences(false);
    expect(localStorage.length).toBe(0);
    expect(localStorage.getItem(REMEMBER_PREFERENCES_KEY)).toBeNull();
    expect([readPreference(language), readPreference(theme)]).toEqual(['es', 'dark']);
  });
});
