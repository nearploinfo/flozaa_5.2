"use client";

import { Link } from "@/components/ui/locale-link";
import { useParamsCompat, usePathnameCompat } from "@/lib/next-router-compat";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  children,
  className,
  activeClassName = "text-foreground font-medium",
  inactiveClassName = "text-muted-foreground",
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  onClick?: () => void;
}) {
  const pathname = usePathnameCompat();
  const params = useParamsCompat<{ lang?: string }>();
  const lang = params?.lang;
  const localePath =
    lang && pathname.startsWith(`/${lang}`)
      ? pathname.slice(lang.length + 1) || "/"
      : pathname;
  const isActive = localePath === href || localePath.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "text-sm transition-colors hover:text-foreground",
        isActive ? activeClassName : inactiveClassName,
        className
      )}
    >
      {children}
    </Link>
  );
}
