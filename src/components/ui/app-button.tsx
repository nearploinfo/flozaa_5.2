import type { ComponentType, SVGProps } from "react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

export type AppButtonVariant =
  | "primary"
  | "secondary"
  | "primary-outline"
  | "secondary-outline"
  | "link";

export type AppButtonSize = "sm" | "md" | "lg";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const VARIANT_CLASSES: Record<AppButtonVariant, string> = {
  primary:
    "bg-button-primary-bg text-button-primary-text hover:bg-button-primary-hover disabled:bg-button-primary-disabled disabled:text-text-disabled",
  secondary:
    "bg-button-secondary-bg text-button-secondary-text hover:opacity-90 disabled:bg-button-secondary-disabled disabled:text-text-disabled disabled:opacity-100",
  "primary-outline":
    "border border-button-primary-outline-border text-button-primary-outline-text hover:bg-button-primary-outline-hover disabled:border-border-default disabled:text-text-disabled",
  "secondary-outline":
    "border border-button-secondary-outline-border text-button-secondary-outline-text hover:bg-button-secondary-outline-hover disabled:border-border-default disabled:text-text-disabled",
  link: "text-button-link-secondary-text hover:text-button-link-secondary-focus disabled:text-text-disabled",
};

const SIZE_CLASSES: Record<AppButtonSize, string> = {
  sm: "px-2 py-1 gap-1 rounded-sm text-sm",
  md: "px-4 py-2 gap-2 rounded-lg text-base",
  lg: "px-6 py-3 gap-2 rounded-xl text-xl",
};

const ICON_ONLY_PADDING: Record<AppButtonSize, string> = {
  sm: "p-1 rounded-sm",
  md: "p-2 rounded-lg",
  lg: "p-3 rounded-xl",
};

const ICON_SIZE: Record<AppButtonSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

export interface AppButtonProps
  extends React.ComponentPropsWithoutRef<"button"> {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  leftIcon?: IconComponent;
  rightIcon?: IconComponent;
  iconOnly?: boolean;
  /** Render as the single child element (e.g. a next/link `<Link>`) instead of a `<button>`. */
  asChild?: boolean;
}

export function AppButton({
  variant = "primary",
  size = "md",
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  iconOnly = false,
  asChild = false,
  className,
  children,
  type = "button",
  ...props
}: AppButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  const iconSize = ICON_SIZE[size];

  const classes = cn(
    "inline-flex items-center justify-center transition-colors duration-200 disabled:pointer-events-none disabled:cursor-not-allowed",
    VARIANT_CLASSES[variant],
    iconOnly ? ICON_ONLY_PADDING[size] : SIZE_CLASSES[size],
    className
  );

  if (asChild) {
    return (
      <Comp className={classes} {...props}>
        {children}
      </Comp>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {LeftIcon && <LeftIcon className={cn(iconSize, "shrink-0")} />}
      {iconOnly ? <span className="sr-only">{children}</span> : children}
      {RightIcon && <RightIcon className={cn(iconSize, "shrink-0")} />}
    </button>
  );
}

