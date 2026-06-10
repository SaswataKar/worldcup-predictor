"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "preferredLocale";

export const LOCALES: { code: string; label: string; flag: string }[] = [
  { code: "en-US", label: "English", flag: "🇺🇸" },
  { code: "hi-IN", label: "हिन्दी", flag: "🇮🇳" },
  { code: "es-ES", label: "Español", flag: "🇪🇸" },
  { code: "fr-FR", label: "Français", flag: "🇫🇷" },
  { code: "pt-BR", label: "Português", flag: "🇧🇷" },
  { code: "de-DE", label: "Deutsch", flag: "🇩🇪" },
  { code: "ar-SA", label: "العربية", flag: "🇸🇦" },
  { code: "ja-JP", label: "日本語", flag: "🇯🇵" },
];

export function useLocale() {
  const [locale, setLocaleState] = useState<string>("en-US");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setLocaleState(stored);
    } else {
      // Default to browser locale if it matches one of our options, else en-US
      const browser = navigator.language;
      const match = LOCALES.find((l) => l.code === browser || l.code.startsWith(browser));
      setLocaleState(match?.code ?? "en-US");
    }
  }, []);

  const setLocale = useCallback((code: string) => {
    localStorage.setItem(STORAGE_KEY, code);
    setLocaleState(code);
  }, []);

  return { locale, setLocale };
}
