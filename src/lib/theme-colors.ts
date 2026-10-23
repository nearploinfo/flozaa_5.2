import { getThemeColorsApi } from "@/api/apiRoutes";
import { applyDynamicManifest } from "@/lib/dynamic-manifest";

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

// API key -> CSS custom property scale name
const COLOR_SCALE_MAP: Record<string, string> = {
  primary: "primary",
  neutral: "neutral",
  success: "success",
  error: "error",
  warn: "warning",
  info: "info",
};

export interface ThemeColorsData {
  updated_at?: string;
  [key: string]: unknown;
}

export interface ThemeColorsResponse {
  data?: ThemeColorsData;
}

export async function fetchThemeColors(): Promise<ThemeColorsData | null> {
  const response: ThemeColorsResponse | null = await getThemeColorsApi().catch(() => null);
  return response?.data ?? null;
}

export function applyThemeColors(data: ThemeColorsData | null | undefined) {
  if (!data) return;

  const root = document.documentElement;
  for (const [apiKey, cssScale] of Object.entries(COLOR_SCALE_MAP)) {
    const shades = data[apiKey] as Record<string, string> | undefined;
    if (!shades) continue;
    for (const shade of SHADES) {
      const value = shades[String(shade)];
      if (value) root.style.setProperty(`--color-${cssScale}-${shade}`, value);
    }
  }

  // The OS status/toolbar color can't be dynamic at launch — it's read from
  // manifest.json's static "theme_color" before any JS runs. Once the admin's
  // actual brand color is applied, correct the live <meta name="theme-color">
  // to match, so mid-session it reflects the real brand instead of staying on
  // the manifest's hardcoded default.
  const primary500 = (data.primary as Record<string, string> | undefined)?.["500"];
  if (primary500) {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", primary500);
    // Fire-and-forget — the manifest patch is best-effort and shouldn't block
    // (or throw into) the synchronous CSS-var/meta-tag updates above.
    void applyDynamicManifest(primary500);
  }
}
