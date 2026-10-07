"use client";

import { useLanguageStore } from "@/store/languageStore";
import { translate, type TranslationKey } from "@/lib/i18n/translations";

export function useTranslation() {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  function t(key: TranslationKey): string {
    return translate(key, language);
  }

  return { t, language, setLanguage };
}
