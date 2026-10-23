"use client";

import {
  ChooseServiceIcon,
  ConfirmBookingIcon,
  GetJobDoneIcon,
  PickDateTimeIcon,
} from "@/components/icons/icons";
import { AppImage } from "@/components/ui/app-image";
import { AppTag } from "@/components/ui/app-tag";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { HowItWorksStepApi } from "@/lib/home-screen";

const FALLBACK_ICONS = [ChooseServiceIcon, PickDateTimeIcon, ConfirmBookingIcon, GetJobDoneIcon];
const LABEL_KEYS = ["step1", "step2", "step3", "step4"];

export function HowItWorksSection({
  title,
  description,
  steps,
}: {
  title: string;
  description: string;
  steps: HowItWorksStepApi[];
}) {
  const { t } = useTranslation();

  return (
    <section className="container hidden flex-col items-center gap-7 commonPY xl:flex">
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-center text-xl font-medium text-text-primary sm:text-2xl">{title}</h2>
        <p className="max-w-3xl text-center text-base text-text-secondary sm:text-lg">{description}</p>
      </div>

      {/* Compact horizontal timeline for mobile/tablet */}
      <div className="flex w-full flex-col gap-8 xl:hidden">
        {steps.map((step, index) => {
          const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];
          return (
            <div key={step.step_key} className="relative flex items-start gap-4">
              {index < steps.length - 1 && (
                <div className="absolute top-14 left-7 h-[calc(100%+2rem)] w-px -translate-x-1/2 border-l border-dashed border-border-default" />
              )}
              <div className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-xl bg-bg-brand-subtle">
                {step.icon ? (
                  <AppImage src={step.icon} alt={step.title} className="size-8 object-contain" />
                ) : (
                  <FallbackIcon className="size-8 text-icon-brand" />
                )}
              </div>
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-sm font-medium text-text-brand">
                  {t(`home.howItWorks.${LABEL_KEYS[index % LABEL_KEYS.length]}.label`)}
                </span>
                <h3 className="text-lg font-medium text-text-primary">{step.title}</h3>
                <p className="text-sm text-text-secondary">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Centered stepper with connecting line for desktop */}
      <div className="relative hidden w-full grid-cols-4 gap-12 xl:grid">
        <div className="absolute top-5 left-[12.5%] right-[12.5%] h-px -translate-y-1/2 bg-border-default" />
        {steps.map((step, index) => {
          const FallbackIcon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];
          return (
            <div key={step.step_key} className="flex flex-col items-center gap-6">
              <AppTag variant="secondary" shape="pill" className="relative shrink-0 px-4 py-2 text-base">
                {t(`home.howItWorks.${LABEL_KEYS[index % LABEL_KEYS.length]}.label`)}
              </AppTag>
              <div className="flex size-20 items-center justify-center rounded-xl bg-bg-brand-subtle p-2">
                {step.icon ? (
                  <AppImage src={step.icon} alt={step.title} className="size-12 object-contain" />
                ) : (
                  <FallbackIcon className="size-12 text-icon-brand" />
                )}
              </div>
              <div className="flex flex-col items-center gap-2 px-4">
                <h3 className="text-center text-xl font-medium text-text-primary">{step.title}</h3>
                <p className="line-clamp-2 text-center text-base text-text-secondary">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
