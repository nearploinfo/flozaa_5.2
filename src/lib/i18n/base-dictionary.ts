import enDictionary from "@/dictionaries/en.json";

export type Dictionary = typeof enDictionary;

// Always the bundled `en` JSON, no network call — last link in the t()
// fallback chain in translation-context.tsx. Split out from dictionaries.ts
// (network-fetching, server-only) so LangLayout can pull this in without
// dragging server-only code into the client bundle.
export function getBaseDictionary(): Dictionary {
  return enDictionary;
}
