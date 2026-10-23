import type { Testimonial } from "@/lib/home-screen";
import { StarIcon } from "@/components/icons/icons";
import { AppImage } from "@/components/ui/app-image";
import { AppTag } from "@/components/ui/app-tag";
import { formatRating } from "@/lib/helpers";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-border-default bg-bg-primary">
      <div className="flex flex-col gap-4 px-4 py-6">
        <AppTag
          variant="warning"
          shape="chip"
          leftIcon={StarIcon}
          iconClassName="text-bg-warning"
          className="w-fit text-base"
        >
          {formatRating(testimonial.rating)}
        </AppTag>
        <p className="line-clamp-4 text-base text-text-primary">{testimonial.quote}</p>
      </div>
      <div className="flex items-center gap-3 border-t border-border-white p-4">
        <div className="flex size-11 items-center justify-center rounded-full border border-border-black p-0.5">
          <AppImage
            src={testimonial.avatar}
            alt={testimonial.name}
            className="size-full rounded-full object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col items-start">
          <span className="text-sm font-medium text-text-primary">{testimonial.name}</span>
          <span className="text-sm text-text-secondary">{testimonial.service}</span>
        </div>
      </div>
    </div>
  );
}
