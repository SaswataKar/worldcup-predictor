"use client";

import { createContext, useContext } from "react";

type LocaleCtx = { locale: string; setLocale: (code: string) => void };

export const LocaleContext = createContext<LocaleCtx>({
  locale: "en-US",
  setLocale: () => {},
});

export const useLocaleCtx = () => useContext(LocaleContext);
