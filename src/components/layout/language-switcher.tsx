"use client";

import { useRouter } from "next/router";
import { usePathnameCompat } from "@/lib/next-router-compat";
import { localizePath } from "@/lib/i18n/locale-path";
import { Globe } from "lucide-react";
import { ChevronDownIcon } from "@/components/icons/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n/translation-context";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathnameCompat();
  const { lang: currentLang, languages, defaultLocale } = useTranslation();

  const switchTo = (lang: string) => {
    // eslint-disable-next-line react-hooks/immutability -- writing a cookie from a click handler, not during render
    document.cookie = `edemand-lang=${lang}; path=/; max-age=31536000`;
    const rest = pathname.startsWith(`/${currentLang}`)
      ? pathname.slice(currentLang.length + 1)
      : pathname;
    router.push(localizePath(rest || "/", lang, defaultLocale));
  };

  const currentLanguage = languages.find((language) => language.code === currentLang);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg">
        <Globe className="size-5 text-icon-primary" />
        <span className="text-lg text-text-primary">
          {currentLang === "en" ? "Eng" : (currentLanguage?.name ?? currentLang)}
        </span>
        <ChevronDownIcon className="size-4 text-icon-primary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {languages.map((language) => (
          <DropdownMenuItem key={language.code} onClick={() => switchTo(language.code)}>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
