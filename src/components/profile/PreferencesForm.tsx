import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme/theme';
import { Moon, Sun } from 'lucide-react';
import { INTERFACE_LANGUAGES, setInterfaceLanguage } from '@/i18n/config';
import { RememberPreferences } from './RememberPreferences';

const option = 'flex cursor-pointer items-center gap-2 border border-input px-4 py-3 text-sm font-medium transition-colors hover:bg-muted has-[:checked]:border-foreground has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring';

/** Interface preferences; the header controls write the same keys (see preferenceStorage). */
export function PreferencesForm() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const language = i18n.language.split('-')[0];
  const themes = [{ value: 'light' as const, label: t('profile.themeLight'), icon: Sun }, { value: 'dark' as const, label: t('profile.themeDark'), icon: Moon }];
  return <div className="space-y-8">
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">{t('common.language')}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {INTERFACE_LANGUAGES.map(({ code, label }) => <label key={code} lang={code} className={option}>
          <input type="radio" name="interface-language" value={code} checked={language === code} onChange={() => setInterfaceLanguage(code)} className="sr-only" />
          {label}
        </label>)}
      </div>
    </fieldset>
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">{t('profile.theme')}</legend>
      <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
        {themes.map(({ value, label, icon: Icon }) => <label key={value} className={option}>
          <input type="radio" name="interface-theme" value={value} checked={theme === value} onChange={() => setTheme(value)} className="sr-only" />
          <Icon className="h-4 w-4" aria-hidden="true" />{label}
        </label>)}
      </div>
    </fieldset>
    <RememberPreferences />
  </div>;
}
