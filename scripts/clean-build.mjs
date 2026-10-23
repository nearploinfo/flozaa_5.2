// Clears build output before a fresh `npm run build`. Runs via the
// "prebuild" npm lifecycle hook — a stale .next/ (e.g. left over from a
// `next dev` run under a different NEXT_PUBLIC_SEO value) can carry
// mismatched generated type files (.next/dev/types vs .next/types both
// declaring PagesPageConfig) that fail typecheck with no code change at
// fault. out/ is the static-export (SEO=false) output directory — stale
// files there would otherwise survive a route that got removed.
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

for (const dir of [".next", "out"]) {
  rmSync(fileURLToPath(new URL(`../${dir}`, import.meta.url)), { recursive: true, force: true });
}
console.log("[clean-build] removed .next/ and out/");
