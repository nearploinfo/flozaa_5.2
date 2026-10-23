import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

export type AppTagVariant =
  | "default"
  | "secondary"
  | "brand"
  | "warning"
  | "error"
  | "success";

export type AppTagShape = "pill" | "chip" | "box";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const VARIANT_CLASSES: Record<AppTagVariant, string> = {
  default: "bg-bg-primary text-text-primary border border-border-default",
  secondary: "bg-bg-secondary text-text-secondary",
  brand: "bg-bg-brand-subtle text-text-brand",
  warning: "bg-bg-warning-subtle text-text-primary",
  error: "bg-bg-error-subtle text-text-error",
  success: "bg-bg-success-subtle text-text-success",
};

const SHAPE_CLASSES: Record<AppTagShape, string> = {
  pill: "rounded-3xl px-3 py-1",
  chip: "rounded-lg px-2 py-1",
  box: "rounded-lg border border-border-default bg-bg-primary p-2",
};

export interface AppTagProps {
  variant?: AppTagVariant;
  shape?: AppTagShape;
  leftIcon?: IconComponent;
  rightIcon?: IconComponent;
  iconClassName?: string;
  className?: string;
  children?: ReactNode;
}

export function AppTag({
  variant = "default",
  shape = "chip",
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  iconClassName,
  className,
  children,
}: AppTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm",
        shape === "box" ? "" : VARIANT_CLASSES[variant],
        SHAPE_CLASSES[shape],
        className
      )}
    >
      {LeftIcon && <LeftIcon className={cn("size-4 shrink-0", iconClassName)} />}
      {children}
      {RightIcon && <RightIcon className={cn("size-4 shrink-0", iconClassName)} />}
    </span>
  );
}
