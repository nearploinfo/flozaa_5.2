import { Quote } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { StarIcon } from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { ReviewApi } from "@/lib/become-provider";

export function ReviewCard({ review }: { review: ReviewApi }) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex h-full min-h-72 flex-col justify-between gap-6 rounded-3xl border border-border-default bg-bg-primary p-7">
      <div className="flex flex-col items-start gap-2">
        <Quote className="size-16 text-text-brand opacity-10" />
        <p className="line-clamp-4 text-base font-normal text-text-secondary">{review.comment}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center gap-4">
          <AppImage
            src={review.profile_image}
            alt={review.username}
            className="size-16 shrink-0 rounded-full object-cover shadow-[0px_14px_36px_3px_rgba(150,150,161,0.18)] outline-2 outline-bg-primary"
          />
          <div className="flex flex-col items-start gap-1">
            <span className="text-base font-medium text-text-primary">{review.username}</span>
            <span className="text-sm font-normal text-text-secondary">{t("becomeProviderPage.providerRole")}</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 rounded-full bg-bg-brand px-2 py-1">
          <StarIcon className="size-3.5 text-white" />
          <span className="text-sm font-normal text-white">{review.rating}</span>
        </div>
      </div>
    </div>
  );
}
