"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function LanguageToggle() {
  const { language, setLanguage } = useTranslation();

  function toggle() {
    setLanguage(language === "en" ? "pcm" : "en");
  }

  return (
    <button
      onClick={toggle}
      aria-label={language === "en" ? "Switch to Pidgin" : "Switch to English"}
      className="flex items-center gap-1 rounded-full px-2.5 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-raised min-h-[44px]"
      title={language === "en" ? "Switch to Pidgin" : "Switch to English"}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      {language === "en" ? "EN" : "PCM"}
    </button>
  );
}
