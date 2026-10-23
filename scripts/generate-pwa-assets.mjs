// Generates every PWA icon + iOS splash-screen size from the source logo
// files. Run after swapping in a white-label logo:
//
//   npm run pwa:assets
//
// Writes straight into public/ — icon.png, icon-192.png, icon-512.png,
// apple-icon.png, maskable-icon-512.png, and the apple-splash-*.png set.
// Also refreshes public/manifest.json's theme_color/background_color.
// See docs/PWA_REBRANDING_GUIDE.md for the full rebrand walkthrough.
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

// Fallback source if splash_logo.svg is missing — square, no transparency.
const ICON_SRC = path.join(PUBLIC_DIR, "app_logo_icon.png");
// Primary logo for every generated asset (icons + splash) — a white/light,
// transparent-background mark or wordmark, composited onto the brand color
// fetched below. Swap this file for your own SVG or PNG.
const SPLASH_LOGO_SRC = path.join(PUBLIC_DIR, "splash_logo.svg");
const MANIFEST_PATH = path.join(PUBLIC_DIR, "manifest.json");

loadDotEnvLocal();

// Every icon (including the maskable one) uses the same treatment as the
// splash screens — white splash_logo.svg centered on the live brand color —
// so there's exactly one look everywhere (Android's auto-built splash draws
// this "any" icon centered over background_color; if this icon had its own
// different-colored background baked in, that'd show as a visible box/seam
// against the flat splash background).
const icons = [
  { name: "icon.png", size: 96, padding: 0.08 },
  { name: "icon-192.png", size: 192, padding: 0.08 },
  { name: "icon-512.png", size: 512, padding: 0.08 },
  { name: "apple-icon.png", size: 180, padding: 0.08 },
  // Android's maskable/adaptive icon needs extra padding — launchers crop
  // this to a circle/squircle/etc. and discard content outside that inner
  // "safe zone".
  { name: "maskable-icon-512.png", size: 512, padding: 0.1 },
];

// device-width x device-height x -webkit-device-pixel-ratio this size
// covers — keep in sync with the <link rel="apple-touch-startup-image">
// tags in pages/_document.tsx.
const splashScreens = [
  { name: "apple-splash-1290-2796.png", w: 1290, h: 2796 }, // iPhone 15/14 Pro Max
  { name: "apple-splash-1284-2778.png", w: 1284, h: 2778 }, // iPhone 14/13/12 Pro Max
  { name: "apple-splash-1179-2556.png", w: 1179, h: 2556 }, // iPhone 15/14 Pro
  { name: "apple-splash-1170-2532.png", w: 1170, h: 2532 }, // iPhone 13/12
  { name: "apple-splash-1125-2436.png", w: 1125, h: 2436 }, // iPhone X/XS/11 Pro
  { name: "apple-splash-1242-2688.png", w: 1242, h: 2688 }, // iPhone XS Max/11 Pro Max
  { name: "apple-splash-828-1792.png", w: 828, h: 1792 }, // iPhone 11/XR
  { name: "apple-splash-750-1334.png", w: 750, h: 1334 }, // iPhone SE2/8/7/6
  { name: "apple-splash-2048-2732.png", w: 2048, h: 2732 }, // iPad Pro 12.9"
  { name: "apple-splash-1668-2388.png", w: 1668, h: 2388 }, // iPad Pro 11"
  { name: "apple-splash-1620-2160.png", w: 1620, h: 2160 }, // iPad 10.2"
];

/** Node doesn't auto-load .env.local for plain scripts (only Next.js does) —
 * parse it by hand so NEXT_PUBLIC_API_URL is available here too. Tolerant
 * of a missing file (falls through to whatever's already in process.env). */
function loadDotEnvLocal() {
  const envPath = path.join(ROOT_DIR, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);
    if (!match) continue;
    const key = match[1];
    let value = (match[2] ?? "").trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

/** The admin's actual configured brand color (same source the running app
 * reads for its primary-500 CSS var / theme-color meta) — falls back to
 * manifest.json's existing theme_color if the API is unreachable, so this
 * still works offline/without a configured backend. */
async function fetchBrandColor() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const fallback = readManifest().theme_color || "#0079FF";
  if (!apiUrl) return fallback;
  try {
    const response = await fetch(new URL("get_theme_colors", apiUrl));
    const json = await response.json();
    return json?.data?.primary?.["500"] || fallback;
  } catch {
    console.warn("Couldn't reach get_theme_colors API — using manifest.json's current theme_color instead.");
    return fallback;
  }
}

function readManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
}

function writeManifestColors(color) {
  const manifest = readManifest();
  manifest.theme_color = color;
  manifest.background_color = color;
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log("updated manifest.json theme_color/background_color to", color);
}

async function main() {
  if (!existsSync(ICON_SRC)) {
    console.error(`\nCouldn't find ${ICON_SRC}`);
    console.error("Put your square, 512x512+ logo PNG there first, then re-run this script.\n");
    process.exitCode = 1;
    return;
  }

  const brandColor = await fetchBrandColor();
  console.log("Using brand color:", brandColor);

  const splashLogoAvailable = existsSync(SPLASH_LOGO_SRC);
  if (!splashLogoAvailable) {
    console.warn(`\nNo ${SPLASH_LOGO_SRC} found — falling back to app_logo_icon.png for icons and splash screens.`);
  }

  for (const { name, size, padding: paddingRatio } of icons) {
    const padding = Math.round(size * paddingRatio);
    const logoWidth = size - padding * 2;
    const logoBuffer = splashLogoAvailable
      ? await sharp(SPLASH_LOGO_SRC).resize({ width: logoWidth }).png().toBuffer()
      : await sharp(ICON_SRC).resize(logoWidth, logoWidth, { fit: "cover" }).png().toBuffer();
    const meta = await sharp(logoBuffer).metadata();
    const left = Math.round((size - (meta.width ?? logoWidth)) / 2);
    const top = Math.round((size - (meta.height ?? logoWidth)) / 2);
    await sharp({
      create: { width: size, height: size, channels: 4, background: brandColor },
    })
      .composite([{ input: logoBuffer, left, top }])
      .png()
      .toFile(path.join(PUBLIC_DIR, name));
    console.log("wrote", name);
  }

  for (const { name, w, h } of splashScreens) {
    const logoWidth = Math.round(Math.min(w, h) * 0.42);
    const logoBuffer = splashLogoAvailable
      ? await sharp(SPLASH_LOGO_SRC).resize({ width: logoWidth }).png().toBuffer()
      : await sharp(ICON_SRC).resize(logoWidth, logoWidth, { fit: "cover" }).png().toBuffer();
    const meta = await sharp(logoBuffer).metadata();
    const left = Math.round((w - (meta.width ?? logoWidth)) / 2);
    const top = Math.round((h - (meta.height ?? logoWidth)) / 2);
    await sharp({
      create: { width: w, height: h, channels: 4, background: brandColor },
    })
      .composite([{ input: logoBuffer, left, top }])
      .png()
      .toFile(path.join(PUBLIC_DIR, name));
    console.log("wrote", name);
  }

  writeManifestColors(brandColor);

  console.log("\nDone.");
}

main();
