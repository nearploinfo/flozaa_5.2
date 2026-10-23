/**
 * Translates the admin-configured `date_format`/`time_format` strings from
 * `get_country_settings` into date-fns pattern strings. The backend mixes
 * two token conventions across deployments — moment/day.js-style
 * (`YYYY-MM-DD`, seen live on the current test backend) and PHP `date()`
 * tokens (`d/m/Y`, `H:i`, `h:i a` — the admin panel's historical option
 * list) — so known exact strings are looked up directly, with a generic
 * char-by-char fallback for anything else so an unrecognized but
 * well-formed value still renders instead of crashing.
 */

const DATE_FORMAT_LOOKUP: Record<string, string> = {
  "YYYY-MM-DD": "yyyy-MM-dd",
  "DD-MM-YYYY": "dd-MM-yyyy",
  "MM-DD-YYYY": "MM-dd-yyyy",
  "DD/MM/YYYY": "dd/MM/yyyy",
  "MM/DD/YYYY": "MM/dd/yyyy",
  "YYYY/MM/DD": "yyyy/MM/dd",
  "d/m/Y": "dd/MM/yyyy",
  "m/d/Y": "MM/dd/yyyy",
  "Y/m/d": "yyyy/MM/dd",
  "Y/d/m": "yyyy/dd/MM",
  "m-d-Y": "MM-dd-yyyy",
  "d-m-Y": "dd-MM-yyyy",
  "Y-m-d": "yyyy-MM-dd",
  "Y-d-m": "yyyy-dd-MM",
  "F j, Y": "MMMM d, yyyy",
  "jS F Y": "do MMMM yyyy",
  "l jS F": "EEEE do MMMM",
  "d M, y": "dd MMM, yy",
  "DD MMM YYYY": "dd MMM yyyy",
};

const TIME_FORMAT_LOOKUP: Record<string, { pattern: string; lowercaseMeridiem: boolean }> = {
  "H:i": { pattern: "HH:mm", lowercaseMeridiem: false },
  "h:i a": { pattern: "hh:mm a", lowercaseMeridiem: true },
  "h:i A": { pattern: "hh:mm a", lowercaseMeridiem: false },
  "HH:mm": { pattern: "HH:mm", lowercaseMeridiem: false },
  "hh:mm A": { pattern: "hh:mm a", lowercaseMeridiem: false },
  "hh:mm a": { pattern: "hh:mm a", lowercaseMeridiem: true },
};

// Longest tokens first so e.g. "YYYY" matches before "YY" does.
const DATE_TOKEN_ORDER: [string, string][] = [
  ["YYYY", "yyyy"],
  ["MMMM", "MMMM"],
  ["MMM", "MMM"],
  ["DD", "dd"],
  ["YY", "yy"],
  ["MM", "MM"],
  ["F", "MMMM"],
  ["l", "EEEE"],
  ["j", "d"],
  ["Y", "yyyy"],
  ["D", "d"],
  ["M", "M"],
  ["y", "yy"],
  ["m", "MM"],
  ["d", "dd"],
];
const DATE_TOKEN_REGEX = new RegExp(DATE_TOKEN_ORDER.map(([token]) => token).join("|"), "g");

// Longest tokens first — moment/day.js-style doubled letters ("HH", "hh", "mm", "ss") must
// match before the single-char PHP tokens ("H", "h", "i", "s") they'd otherwise be chewed up by.
const TIME_TOKEN_ORDER: [string, string][] = [
  ["HH", "HH"],
  ["hh", "hh"],
  ["mm", "mm"],
  ["ss", "ss"],
  ["H", "HH"],
  ["G", "H"],
  ["h", "hh"],
  ["g", "h"],
  ["i", "mm"],
  ["s", "ss"],
  ["A", "a"],
  ["a", "a"],
];
const TIME_TOKEN_REGEX = new RegExp(TIME_TOKEN_ORDER.map(([token]) => token).join("|"), "g");

/** Converts a `date_format` setting value to a date-fns pattern. Falls back to
 * `fallback` (already a date-fns pattern) when the input is empty. */
export function toDateFnsDatePattern(dateFormat: string | undefined, fallback: string): string {
  if (!dateFormat) return fallback;
  const known = DATE_FORMAT_LOOKUP[dateFormat];
  if (known) return known;
  const map = new Map(DATE_TOKEN_ORDER);
  return dateFormat.replace(DATE_TOKEN_REGEX, (token) => map.get(token) ?? token);
}

/** Converts a `time_format` setting value to a date-fns pattern, plus whether
 * the am/pm marker should be lowercased after formatting (date-fns always
 * renders "AM"/"PM"). Falls back to `fallback` when the input is empty. */
export function toDateFnsTimePattern(
  timeFormat: string | undefined,
  fallback: { pattern: string; lowercaseMeridiem: boolean }
): { pattern: string; lowercaseMeridiem: boolean } {
  if (!timeFormat) return fallback;
  const known = TIME_FORMAT_LOOKUP[timeFormat];
  if (known) return known;
  const map = new Map(TIME_TOKEN_ORDER);
  const pattern = timeFormat.replace(TIME_TOKEN_REGEX, (token) => map.get(token) ?? token);
  return { pattern, lowercaseMeridiem: timeFormat.includes("a") && !timeFormat.includes("A") };
}

export function applyMeridiemCase(formatted: string, lowercaseMeridiem: boolean): string {
  return lowercaseMeridiem ? formatted.replace(/\b(AM|PM)\b/, (match) => match.toLowerCase()) : formatted;
}
