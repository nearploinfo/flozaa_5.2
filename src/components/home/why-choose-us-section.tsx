"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/home/stat-card";
import { AppImage } from "@/components/ui/app-image";
import { ProviderIcon, ServiceIcon, StarIcon, TimeIcon } from "@/components/icons/icons";
import type { WhyChooseUsStatApi } from "@/lib/home-screen";

const STAT_ICONS = [ServiceIcon, ProviderIcon, TimeIcon, StarIcon];

export function WhyChooseUsSection({
  title,
  description,
  sectionImage,
  points,
  stats,
}: {
  title: string;
  description: string;
  sectionImage: string;
  points: string[];
  stats: WhyChooseUsStatApi[];
}) {
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEnteredView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(grid);

    return () => observer.disconnect();
  }, []);

  const paragraphs = description.split("\n\n").filter(Boolean);

  // A stat with no data yet (0) is noise, not a milestone — hide its card
  // instead of showing an empty-looking "0 Verified Professionals".
  const visibleStats = stats.filter((stat) => {
    const numericValue = typeof stat.value === "number" ? stat.value : Number.parseFloat(stat.value) || 0;
    return numericValue > 0;
  });

  return (
    <section className="container hidden flex-col gap-10 commonPY xl:flex">
      <div className="flex flex-col items-center gap-7 lg:flex-row">
        <div className="flex flex-1 flex-col gap-10">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-medium text-text-primary sm:text-2xl">{title}</h2>
            {paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-base text-text-secondary sm:text-lg">
                {paragraph}
              </p>
            ))}
          </div>
          {points.length > 0 && (
            <ul className="flex flex-col gap-4">
              {points.map((point) => (
                <li key={point} className="flex items-center gap-3 text-base text-text-primary">
                  <CheckCircle2 className="size-6 text-icon-brand" />
                  {point}
                </li>
              ))}
            </ul>
          )}
        </div>

        {sectionImage && (
          <div className="w-full max-w-xl shrink-0">
            <AppImage src={sectionImage} alt={title} className="h-auto w-full" />
          </div>
        )}
      </div>

      {visibleStats.length > 0 && (
        <>
          <div className="dashed-divider" />

          <div ref={gridRef} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {visibleStats.map((stat, index) => {
              const numericValue =
                typeof stat.value === "number" ? stat.value : Number.parseFloat(stat.value) || 0;
              const decimals = numericValue % 1 !== 0 ? 1 : 0;

              return (
                <StatCard
                  key={stat.metric_key}
                  stat={{
                    id: stat.metric_key,
                    target: numericValue,
                    suffix: "",
                    decimals,
                    label: stat.title,
                  }}
                  iconUrl={stat.icon}
                  FallbackIcon={STAT_ICONS[index % STAT_ICONS.length] ?? ServiceIcon}
                  shouldAnimate={hasEnteredView}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
