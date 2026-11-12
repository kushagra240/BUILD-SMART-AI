import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../../i18n';

const LANGUAGE_LABEL_KEYS: Record<SupportedLanguage, string> = {
  en: 'language.en',
  hi: 'language.hi',
  mr: 'language.mr',
};

/** Compact language picker for the main navbar (English, Hindi, Marathi). */
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const selectId = useId();

  const detected = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0];
  const current = (SUPPORTED_LANGUAGES as readonly string[]).includes(detected)
    ? (detected as SupportedLanguage)
    : 'en';

  return (
    <div className="inline-flex items-center gap-1.5">
      <Languages className="h-3.5 w-3.5 shrink-0 text-ink-soft" aria-hidden="true" />
      <label htmlFor={selectId} className="sr-only">
        {t('language.label')}
      </label>
      <select
        id={selectId}
        value={current}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
        className="max-w-[7.5rem] rounded border border-ink/14 bg-paper px-1.5 py-1 font-sans text-xs text-ink focus-ring"
      >
        {SUPPORTED_LANGUAGES.map((code) => (
          <option key={code} value={code}>
            {t(LANGUAGE_LABEL_KEYS[code])}
          </option>
        ))}
      </select>
    </div>
  );
}
