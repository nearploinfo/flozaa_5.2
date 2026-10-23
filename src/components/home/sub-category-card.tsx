import { Link } from "@/components/ui/locale-link";

import { AppImage } from "@/components/ui/app-image";
import { AppTag } from "@/components/ui/app-tag";
import { ArrowUpRightIcon } from "@/components/icons/icons";

export interface SubCategoryCardItem {
  id: string;
  name: string;
  image: string;
  providerCount: number;
  href: string;
}

export function SubCategoryCard({ item }: { item: SubCategoryCardItem }) {
  return (
    <Link
      href={item.href}
      className="group flex w-64 flex-col items-center gap-4 rounded-xl"
    >
      <div className="relative aspect-260/345 w-64 overflow-hidden rounded-xl transition-shadow duration-300 group-hover:shadow-[0px_8px_20px_0px_rgba(0,0,0,0.08)]">
        <AppImage
          src={item.image}
          alt={item.name}
          className="aspect-260/345 w-64 rounded-xl object-cover"
        />
        <div className="absolute inset-0 flex -translate-y-full items-center justify-center rounded-xl bg-black/40 transition-transform duration-300 group-hover:translate-y-0">
          <AppTag
            shape="box"
            leftIcon={ArrowUpRightIcon}
            iconClassName="size-5 text-icon-primary"
            className="size-10 items-center justify-center rounded-lg border-0 bg-button-primary-text p-2"
          />
        </div>
      </div>

      <div className="flex w-64 flex-col items-start gap-1">
        <span className="line-clamp-2 w-full text-lg font-medium text-text-primary transition-colors duration-300 group-hover:text-text-brand">
          {item.name}
        </span>
        <span className="text-base text-text-secondary">
          {item.providerCount} Providers
        </span>
      </div>
    </Link>
  );
}
