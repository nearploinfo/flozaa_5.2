"use client";

import type { SVGProps } from "react";
import type { Stat } from "@/lib/home-screen";
import { useCountUp } from "@/lib/use-count-up";
import { AppImage } from "@/components/ui/app-image";

export function StatCard({
  stat,
  iconUrl,
  FallbackIcon,
  shouldAnimate,
}: {
  stat: Stat;
  /** Admin-provided icon image URL from the API — used when present. */
  iconUrl?: string;
  /** Static icon shown when the API sends no icon for this stat. */
  FallbackIcon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element;
  shouldAnimate: boolean;
}) {
  const value = useCountUp(stat.target, stat.decimals, shouldAnimate);

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border-default bg-bg-secondary p-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:p-6 sm:text-left">
      <span className="flex shrink-0 items-center justify-center rounded-full p-1 outline outline-1 outline-border-brand">
        <span className="flex size-12 items-center justify-center rounded-full bg-bg-brand p-2.5 sm:size-16 sm:p-3">
          {iconUrl ? (
            <AppImage src={iconUrl} alt="" className="size-7 object-contain sm:size-10" />
          ) : (
            <FallbackIcon className="size-7 text-white sm:size-10" />
          )}
        </span>
      </span>
      <div className="flex flex-col gap-1 sm:gap-2">
        <span className="text-2xl font-medium text-text-primary sm:text-3xl">
          {value.toFixed(stat.decimals)}
          {stat.suffix}
        </span>
        <span className="text-sm text-text-primary sm:text-lg">{stat.label}</span>
      </div>
    </div>
  );
}
