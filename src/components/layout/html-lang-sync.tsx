"use client";

import { useEffect } from "react";

export function HtmlLangSync({ lang, isRtl = false }: { lang: string; isRtl?: boolean }) {
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  }, [lang, isRtl]);

  return null;
}
