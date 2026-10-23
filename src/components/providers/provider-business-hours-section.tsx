"use client";

import { ClockIcon } from "@/components/icons/icons";
import { AppTag } from "@/components/ui/app-tag";
import type { BusinessHour } from "@/lib/providers-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";

export function ProviderBusinessHoursSection({
  businessHours,
  openNow,
}: {
  businessHours: BusinessHour[];
  /** Drives the max-lg "Open Now" badge; omit to hide it. */
  openNow?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <>
      <ProviderBusinessHoursMobile businessHours={businessHours} openNow={openNow} />

      <div className="hidden w-[521px] shrink-0 xl:flex flex-col items-start gap-4 rounded-xl border border-border-default bg-bg-primary p-6">
        <h2 className="self-stretch text-lg font-medium text-text-primary">
          {t("providerDetails.businessHours.title")}
        </h2>

        <div className="flex flex-col items-start self-stretch rounded-xl gap-6">
          {businessHours.map((hour) => (
            <div
              key={hour.day}
              className="flex flex-col items-start gap-3 self-stretch rounded-lg border border-border-default bg-bg-secondary p-3"
            >
              <div className="flex items-center gap-3 self-stretch">
                <span className="flex-1 text-base font-medium text-text-primary">
                  {hour.day}
                </span>
                {hour.isToday && (
                  <AppTag
                    shape="pill"
                    className="justify-center gap-2.5 border-0 bg-bg-brand py-1 text-sm text-text-inverse-light"
                  >
                    {t("providerDetails.businessHours.today")}
                  </AppTag>
                )}
              </div>
              <div className="flex flex-col items-center gap-4 self-stretch rounded-lg border border-border-default bg-bg-primary px-4 py-3">
                {hour.slots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 self-stretch rounded-xl"
                  >
                    <div className="flex flex-1 items-center gap-2">
                      <ClockIcon
                        className={
                          slot.onLeave
                            ? "size-6 text-icon-secondary"
                            : "size-6 text-icon-primary"
                        }
                      />
                      <span
                        className={
                          slot.onLeave
                            ? "text-base text-text-secondary line-through"
                            : "text-base text-text-primary"
                        }
                      >
                        {slot.time}
                      </span>
                    </div>
                    {slot.onLeave && (
                      <span className="text-base text-text-error">
                        {t("providerDetails.businessHours.onLeave")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/** max-lg layout: day rows with time chips, a red "Closed" for days off, and an open-now badge. */
function ProviderBusinessHoursMobile({
  businessHours,
  openNow,
}: {
  businessHours: BusinessHour[];
  openNow?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col items-start gap-2 self-stretch rounded-xl bg-bg-primary p-3 xl:hidden md:gap-4 md:p-4">
      <div className="flex w-full items-center gap-2">
        <h2 className="flex-1 text-sm font-semibold text-text-primary md:text-base md:font-medium">
          {t("providerDetails.businessHours.title")}
        </h2>
        {openNow !== undefined && (
          <span
            className={`flex items-center gap-1 rounded-sm p-1 text-xs font-normal ${
              openNow ? "bg-bg-brand-subtle text-text-brand" : "bg-bg-error-subtle text-text-error"
            }`}
          >
            <span className={`size-2 rounded-full ${openNow ? "bg-bg-brand" : "bg-bg-error"}`} />
            {openNow
              ? t("providerDetails.businessHours.openNow")
              : t("providerDetails.businessHours.closedNow")}
          </span>
        )}
      </div>

      <div className="flex w-full flex-col gap-4">
        {businessHours.map((hour, index) => {
          const isClosed = hour.slots.every((slot) => slot.closed);
          return (
            <div key={hour.day} className="contents">
              {index > 0 && <div className="dashed-divider" />}
              {isClosed ? (
                <div className="flex w-full items-center gap-1">
                  <span className="flex-1 text-sm font-normal text-text-primary">{hour.day}</span>
                  <span className="text-sm font-normal text-text-error">
                    {t("providerDetails.businessHours.closed")}
                  </span>
                </div>
              ) : (
                <div className="flex w-full flex-col items-start gap-2 rounded-lg bg-bg-secondary p-2">
                  <div className="flex w-full items-center gap-2">
                    <span className="flex-1 text-xs font-medium text-text-primary">{hour.day}</span>
                    {hour.isToday && (
                      <AppTag
                        shape="pill"
                        className="border-0 bg-bg-brand px-2 py-0.5 text-xs text-text-inverse-light"
                      >
                        {t("providerDetails.businessHours.today")}
                      </AppTag>
                    )}
                  </div>

                  <div className="flex w-full flex-col items-start gap-2 md:gap-0 md:rounded-lg md:bg-bg-primary md:p-2">
                    {hour.slots.map((slot, slotIndex) => (
                      <div
                        key={slotIndex}
                        className="flex w-full items-center gap-1 rounded-lg bg-bg-primary p-2 md:rounded-none md:bg-transparent md:p-0"
                      >
                        <ClockIcon
                          className={
                            slot.onLeave
                              ? "size-4 shrink-0 text-icon-secondary"
                              : "size-4 shrink-0 text-icon-primary"
                          }
                        />
                        <span
                          className={
                            slot.onLeave
                              ? "flex-1 text-xs text-text-secondary line-through"
                              : "flex-1 text-xs text-text-primary"
                          }
                        >
                          {slot.time}
                        </span>
                        {slot.onLeave && (
                          <span className="text-xs text-text-error">
                            {t("providerDetails.businessHours.onLeave")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
