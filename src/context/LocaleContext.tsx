"use client";

import { createContext, useContext } from "react";

export const LocaleContext = createContext<string>("en-US");

export const useLocaleCtx = () => useContext(LocaleContext);
