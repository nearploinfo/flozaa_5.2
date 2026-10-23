import type { ComponentType, SVGProps } from "react";
import { AppImage } from "@/components/ui/app-image";
import { cn } from "@/lib/utils";

export function EmptyState({
  image,
  icon: Icon,
  title,
  description,
  className,
}: {
  image?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-3 self-stretch py-10 text-center",
        className
      )}
    >
      {image ? (
        <AppImage src={image} alt={title} className="size-20 rounded-lg object-cover" />
      ) : (
        Icon && (
          <div className="flex size-14 items-center justify-center rounded-full bg-bg-secondary">
            <Icon className="size-6 text-icon-secondary" />
          </div>
        )
      )}
      <div className="flex flex-col items-center gap-1">
        <p className="text-base font-medium text-text-primary">{title}</p>
        {description && <p className="text-sm text-text-secondary">{description}</p>}
      </div>
    </div>
  );
}
