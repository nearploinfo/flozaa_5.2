"use client";

import type { ComponentType, ReactNode, SVGProps } from "react";

// Shared pill-button primitive for filter chip rows (mobile filter sheets,
// and the category-mode quick-filter row on /services and /providers).
export function FilterChip({
  active,
  icon: Icon,
  onClick,
  children,
}: {
  active: boolean;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm whitespace-nowrap transition-colors duration-200 ${
        active
          ? "border-border-brand bg-bg-brand-subtle text-text-brand"
          : "border-border-default bg-bg-secondary text-text-primary"
      }`}
    >
      {Icon && (
        <Icon className={`size-4 shrink-0 ${active ? "text-icon-brand" : "text-icon-secondary"}`} />
      )}
      {children}
    </button>
  );
}

export function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <span className="text-sm font-semibold text-text-primary">{title}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
