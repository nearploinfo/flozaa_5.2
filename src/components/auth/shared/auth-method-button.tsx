import type { ComponentType, SVGProps } from "react";
import { AppButton } from "@/components/ui/app-button";

export function AuthMethodButton({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <AppButton
      variant="secondary-outline"
      size="md"
      leftIcon={Icon}
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-sm border-border-default bg-bg-primary px-4 py-3 hover:bg-bg-secondary"
    >
      <span className="text-sm text-text-primary">{label}</span>
    </AppButton>
  );
}
