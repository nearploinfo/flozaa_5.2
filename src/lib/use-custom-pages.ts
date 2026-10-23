"use client";

import { useQuery } from "@tanstack/react-query";
import { getCustomPagesApi } from "@/api/apiRoutes";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useAppSelector } from "@/store/hooks";

export interface CustomPageLink {
  slug: string;
  title: string;
}

interface CustomPageApi {
  slug?: string;
  title?: string;
  translated_title?: string;
}

/** Footer's admin-created page links — cached per language since `translated_title`
 * changes with Content-Language. get_custom_pages is country-specific (v5.2.0),
 * so this stays disabled until a location is actually set rather than firing an
 * unscoped request on every page load; it fires (and the footer's links show up)
 * the moment the user picks a location. */
export function useCustomPages() {
  const { lang } = useTranslation();
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);
  const hasLocation = typeof lat === "number" && typeof lng === "number";

  const query = useQuery({
    queryKey: ["custom_pages", lang, lat, lng],
    queryFn: async (): Promise<CustomPageLink[]> => {
      const response = await getCustomPagesApi({ latitude: lat as number, longitude: lng as number });
      if (response?.error) throw new Error(response?.message);
      const list: CustomPageApi[] = response?.data ?? [];
      return list
        .filter((page): page is CustomPageApi & { slug: string } => Boolean(page.slug))
        .map((page) => ({ slug: page.slug, title: page.translated_title || page.title || page.slug }));
    },
    enabled: hasLocation,
  });

  return {
    pages: query.data ?? [],
    status: !hasLocation || query.isPending ? "loading" : query.isError ? "error" : "loaded",
  } as const;
}
