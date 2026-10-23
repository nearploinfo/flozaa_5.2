"use client";

import type { ComponentType, SVGProps } from "react";
import { useParamsCompat, usePathnameCompat } from "@/lib/next-router-compat";
import { Link } from "@/components/ui/locale-link";
import { ChevronRightIcon } from "@/components/icons/icons";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

function Row({
  icon: Icon,
  label,
  active,
  destructive,
  badge,
  children,
}: {
  icon: IconComponent;
  label: string;
  active?: boolean;
  destructive?: boolean;
  /** Unread-style count pill next to the label; omitted entirely when 0/undefined. */
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-2 self-stretch rounded-lg border p-3",
        active ? "border-border-brand bg-bg-brand-subtle" : "border-border-default bg-bg-primary"
      )}
    >
      <span className="flex items-center justify-center rounded-sm bg-bg-secondary p-2">
        <Icon className="size-5 text-icon-primary" />
      </span>
      <span className={cn("flex-1 text-base", destructive ? "text-form-field-error" : "text-text-primary")}>
        {label}
      </span>
      {!!badge && (
        <span className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-bg-error px-1.5 py-0.5 text-xs font-medium text-text-inverse-dark">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {children}
    </div>
  );
}

/** Sidebar row that links to another route — highlights itself when it matches the current page. */
export function AccountNavLink({
  icon,
  label,
  href,
  activeWhen,
  badge,
}: {
  icon: IconComponent;
  label: string;
  href: string;
  /** Overrides the default href-prefix match — for routes that share a prefix with a sibling nav item (e.g. /chats vs /chats/admin). */
  activeWhen?: (localPath: string) => boolean;
  badge?: number;
}) {
  const pathname = usePathnameCompat();
  const params = useParamsCompat<{ lang?: string }>();
  const lang = params?.lang;
  const localePath = lang && pathname.startsWith(`/${lang}`) ? pathname.slice(lang.length + 1) || "/" : pathname;
  const active = activeWhen
    ? activeWhen(localePath)
    : localePath === href || localePath.startsWith(`${href}/`);

  return (
    <Link href={href} className="w-full">
      <Row icon={icon} label={label} active={active} badge={badge}>
        <ChevronRightIcon className="size-5 shrink-0 text-button-link-secondary-text rtl:rotate-180" />
      </Row>
    </Link>
  );
}

/** Sidebar row that triggers an action (change password, logout, delete account) instead of navigating. */
export function AccountNavAction({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: IconComponent;
  label: string;
  onClick?: () => void;
  destructive?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} className="w-full text-start">
      <Row icon={icon} label={label} destructive={destructive}>
        <ChevronRightIcon className="size-5 shrink-0 text-button-link-secondary-text rtl:rotate-180" />
      </Row>
    </button>
  );
}
