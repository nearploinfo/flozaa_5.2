import { CheckCircleIcon, LocationPinIcon, StarIcon } from "@/components/icons/icons";
import { AppImage } from "@/components/ui/app-image";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { TopProviderApi } from "@/lib/become-provider";

const VISIBLE_SERVICE_COUNT = 2;

export function ProviderCard({ provider }: { provider: TopProviderApi }) {
  const { t } = useTranslation();
  const name = provider.translated_company_name || provider.company_name;
  const services = (provider.services ?? []).filter((service) => service.translated_title || service.title);
  const visibleServices = services.slice(0, VISIBLE_SERVICE_COUNT);
  const remainingCount = services.length - visibleServices.length;

  return (
    <div className="flex h-full w-full max-w-96 min-h-56 flex-col items-start gap-6 rounded-3xl border border-border-default bg-bg-primary p-6">
      <div className="flex items-start gap-4 self-stretch">
        <AppImage src={provider.image} alt={name} className="size-20 shrink-0 rounded-2xl object-cover" />
        <div className="flex flex-1 flex-col items-start gap-2">
          <span className="text-base font-bold text-text-primary">{name}</span>

          {provider.location && (
            <div className="flex items-center gap-1 self-stretch">
              <LocationPinIcon className="size-4 shrink-0 text-text-primary" />
              <span className="line-clamp-1 flex-1 text-sm font-normal text-text-primary">{provider.location}</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            {Number(provider.average_rating) > 0 && (
              <div className="flex items-center gap-1 rounded-sm bg-yellow-600/10 px-2 py-1">
                <StarIcon className="size-4 text-yellow-600" />
                <span className="text-base font-medium text-yellow-600">
                  {Number(provider.average_rating).toFixed(1)}
                </span>
              </div>
            )}
            {Boolean(provider.completed_orders && provider.completed_orders > 0) && (
              <div className="flex items-center gap-1 rounded-sm bg-lime-500/10 px-2 py-1">
                <CheckCircleIcon className="size-4 text-lime-500" />
                <span className="text-base font-medium text-lime-500">
                  {t("becomeProviderPage.ordersDone", { count: provider.completed_orders ?? 0 })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {visibleServices.length > 0 && (
        <>
          <span className="h-px w-full shrink-0 bg-border-default" />
          <div className="flex flex-wrap items-center gap-2 self-stretch">
            {visibleServices.map((service, index) => (
              <span
                key={index}
                className="truncate rounded-sm bg-bg-secondary px-2 py-1 text-base whitespace-nowrap text-text-secondary"
              >
                {service.translated_title || service.title}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="shrink-0 rounded-sm bg-bg-secondary px-2 py-1 text-base whitespace-nowrap text-text-secondary">
                +{remainingCount}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
