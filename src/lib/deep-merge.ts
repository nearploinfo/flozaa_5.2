type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Overlays `override` onto `base`, recursing into nested objects. Missing
// keys in `override` fall through to `base` — used so a partial/incomplete
// API dictionary still fills in from the local fallback JSON.
//
// A scalar override value never clobbers an object base value at the same
// key — two dictionaries with different key schemas (e.g. a flat legacy
// file overlaid onto our nested i18n namespaces) can coincidentally share a
// top-level key name with an unrelated meaning; silently replacing a whole
// nested namespace with a random string would break every key under it.
export function deepMerge<T extends PlainObject>(base: T, override: PlainObject): T {
  const result: PlainObject = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key];
    if (isPlainObject(baseValue)) {
      if (isPlainObject(value)) result[key] = deepMerge(baseValue, value);
      continue;
    }
    result[key] = value;
  }
  return result as T;
}
