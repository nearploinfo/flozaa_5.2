import { siteConfig } from "@/lib/site-config";

export function Loader() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-bg-brand-subtle">
      <div className="app-loader">
        <span>{siteConfig.appName}</span>
      </div>
    </div>
  );
}
