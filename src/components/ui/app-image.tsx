"use client";

import Image, { type StaticImageData } from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

export function AppImage({
  src,
  alt,
  className,
  priority,
  fill,
  style,
}: {
  src: StaticImageData | string;
  alt: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  style?: CSSProperties;
}) {
  const [hasErrored, setHasErrored] = useState(false);
  const [mounted, setMounted] = useState(false);
  const webSettings = useAppSelector((state) => state.settings.data?.web_settings) as
    | { web_half_logo?: string }
    | undefined;
  // Settings load client-side only (after AppBootstrap fetch), so the SSR pass
  // never has a placeholder to fall back to. Gate on `mounted` to keep the
  // first client render identical to the server render and avoid a hydration
  // mismatch; the placeholder swaps in on the next tick once settings arrive.
  const placeholder = mounted ? (webSettings?.web_half_logo ?? "") : "";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (typeof src === "string") {
    const isPlaceholder = (!src || hasErrored) && !!placeholder;
    const resolvedSrc = isPlaceholder ? placeholder : src;
    const showBrokenFallback = (!src || hasErrored) && !placeholder;

    if (showBrokenFallback) {
      return (
        <span
          className={cn(
            "flex items-center justify-center bg-bg-secondary",
            className,
            fill && "absolute inset-0 h-full w-full"
          )}
          style={style}
        >
          <ImageOff className="size-[28%] text-icon-secondary" />
        </span>
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolvedSrc}
        alt={alt}
        className={cn(
          className,
          fill && "absolute inset-0 h-full w-full",
          isPlaceholder &&
            "scale-100! bg-bg-secondary object-contain p-[12%] opacity-40 transition-none! group-hover:scale-100!"
        )}
        style={style}
        onError={() => {
          if (!hasErrored) setHasErrored(true);
        }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      priority={priority}
      fill={fill}
      style={style}
    />
  );
}
