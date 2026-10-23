"use client";

import NextLink from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useTranslation } from "@/lib/i18n/translation-context";
import { localizePath } from "@/lib/i18n/locale-path";
import { siteConfig } from "@/lib/site-config";

type Props = ComponentProps<typeof NextLink>;

function localizeHref(href: Props["href"], lang: string, defaultLocale: string): Props["href"] {
  if (typeof href !== "string") return href;
  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    /^[a-z]+:\/\//i.test(href)
  ) {
    return href;
  }
  if (!href.startsWith("/")) return href;
  return localizePath(href, lang, defaultLocale);
}

export function Link({ href, onClick, ...props }: Props) {
  const { lang, defaultLocale } = useTranslation();
  const localizedHref = localizeHref(href, lang, defaultLocale);

  // Static export only ever registers the shared dynamic page (e.g.
  // /[lang]/categories) for non-default locales — next/link's soft
  // navigation can't resolve a locale-prefixed href against it (no
  // matching page), so it 404s or leaves a literal [lang] in the URL.
  // Force a full browser navigation instead, same as a hard reload would.
  const needsHardNav = !siteConfig.seoEnabled && lang !== defaultLocale;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      !needsHardNav ||
      typeof localizedHref !== "string" ||
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    window.location.href = localizedHref;
  }

  return <NextLink href={localizedHref} onClick={handleClick} {...props} />;
}
