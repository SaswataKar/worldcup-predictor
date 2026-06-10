"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/hooks/useLocale";
import { LocaleContext } from "@/context/LocaleContext";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const { locale, setLocale } = useLocale();

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
      >
        {children}
      </motion.div>
    </LocaleContext.Provider>
  );
}
