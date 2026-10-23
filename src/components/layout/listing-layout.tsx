import type { ReactNode } from "react";

export function ListingLayout({
  toolbar,
  filters,
  contentClassName = "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
  children,
}: {
  toolbar: ReactNode;
  filters: ReactNode;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full bg-bg-secondary">
      <div className="container flex flex-col gap-6 pt-10 pb-16">
        {toolbar}
        <div className="flex items-start gap-6">
          {filters}
        <div className={`min-w-0 flex-1 ${contentClassName}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
