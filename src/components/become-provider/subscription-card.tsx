import { CheckCircleIcon } from "@/components/icons/icons";
import { usePriceFormatter } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { SubscriptionApi } from "@/lib/become-provider";

export function SubscriptionCard({ subscription }: { subscription: SubscriptionApi }) {
  const { t } = useTranslation();
  const formatPrice = usePriceFormatter();

  const hasDiscount = Number(subscription.discount_price) > 0;
  const name = subscription.translated_name || subscription.name;
  const description = subscription.translated_description || subscription.description;
  const effectivePrice = hasDiscount ? subscription.discount_price : subscription.price;
  const isFree = Number(effectivePrice) === 0;

  const features = [
    `${t("becomeProviderPage.orderType")}: ${
      subscription.order_type === "limited" ? t("becomeProviderPage.limited") : t("becomeProviderPage.unlimited")
    }`,
    `${t("becomeProviderPage.maxOrders")}: ${subscription.max_order_limit || t("becomeProviderPage.unlimited")}`,
    `${t("becomeProviderPage.serviceType")}: ${
      subscription.service_type === "limited" ? t("becomeProviderPage.limited") : t("becomeProviderPage.unlimited")
    }`,
    `${t("becomeProviderPage.commission")}: ${
      subscription.is_commision === "yes"
        ? `${subscription.commission_percentage}% (${t("becomeProviderPage.threshold")}: ${formatPrice(
            subscription.commission_threshold
          )})`
        : t("becomeProviderPage.noCommission")
    }`,
    `${t("becomeProviderPage.tax")}: ${
      subscription.tax_type === "included" ? t("becomeProviderPage.included") : t("becomeProviderPage.excluded")
    }`,
    `${t("becomeProviderPage.discountPrice")}: ${
      hasDiscount ? formatPrice(subscription.discount_price) : t("becomeProviderPage.noDiscount")
    }`,
  ];

  return (
    <div className="group flex w-full flex-col gap-6 overflow-hidden rounded-3xl bg-bg-primary p-6">
      <div className="flex flex-col items-start gap-3 self-stretch rounded-sm">
        <span className="rounded-sm bg-bg-brand/5 px-3 py-2 text-base font-medium text-text-brand">{name}</span>

        <div className="flex flex-wrap items-center gap-3 self-stretch sm:flex-nowrap sm:gap-4">
          <div className="flex items-end gap-1">
            <span className="text-3xl leading-9 font-bold text-text-primary sm:text-5xl sm:leading-[58px]">
              {isFree ? t("becomeProviderPage.free") : formatPrice(effectivePrice)}
            </span>
            {hasDiscount && (
              <span className="text-lg leading-6 font-medium text-text-secondary line-through sm:text-3xl sm:leading-8">
                {formatPrice(subscription.price)}
              </span>
            )}
          </div>
          <span className="h-10 w-px shrink-0 bg-border-default sm:h-14" />
          <div className="flex flex-col items-start gap-1">
            <span className="text-base font-medium text-text-primary sm:text-xl">
              {t("becomeProviderPage.duration")}
            </span>
            <span className="text-sm font-normal text-text-secondary sm:text-base">
              {subscription.duration} {t("becomeProviderPage.days")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 self-stretch rounded-sm">
        <div className="flex flex-col items-start gap-1 self-stretch rounded-sm bg-bg-brand/5 p-4">
          <p className="line-clamp-2 self-stretch text-base font-normal text-text-primary">{description}</p>
        </div>

        <ul className="flex max-h-26 flex-col gap-4 overflow-hidden transition-[max-height] duration-500 ease-in-out group-hover:max-h-125">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <CheckCircleIcon className="size-6 shrink-0 text-lime-500" />
              <span className="flex-1 text-base font-normal text-text-secondary">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
