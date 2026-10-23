"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/translation-context";

/** Rough plain-text length past which the max-lg copy is clamped behind Read More. */
const CLAMP_THRESHOLD = 220;

export function ProviderAboutSection({
  about,
  longDescription,
}: {
  about: string;
  longDescription: string;
}) {
  const { t } = useTranslation();
  return (
    <>
      <ProviderAboutMobile about={about} longDescription={longDescription} />

      <div className="hidden flex-col items-center gap-4 self-stretch overflow-hidden rounded-xl border border-border-default bg-bg-primary p-4 xl:flex">
        <h2 className="self-stretch text-lg font-medium text-text-primary">
          {t("providerDetails.about.title")}
        </h2>

        <div className="flex flex-col items-start gap-3 self-stretch">
          {about && <p className="self-stretch text-base text-text-primary">{about}</p>}
          {longDescription && (
            // long_description is CMS-authored rich text (e.g. "<p>...</p>") from the provider dashboard, not user input
            <div
              className="self-stretch text-base text-text-primary [&_p]:m-0"
              dangerouslySetInnerHTML={{ __html: longDescription }}
            />
          )}
        </div>
      </div>
    </>
  );
}

/** max-lg layout: card with a clamped description and a Read More toggle. */
function ProviderAboutMobile({
  about,
  longDescription,
}: {
  about: string;
  longDescription: string;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const plainLength =
    about.length + longDescription.replace(/<[^>]*>/g, "").length;
  const isClampable = plainLength > CLAMP_THRESHOLD;

  return (
    <section className="flex flex-col items-start gap-3 self-stretch rounded-xl bg-bg-primary p-4 xl:hidden">
      <h2 className="text-base font-semibold text-text-primary">
        {t("providerDetails.about.mobileTitle")}
      </h2>

      {/*
        longDescription is CMS-authored rich text and can contain nested block
        elements with their own padding/line height. -webkit-line-clamp only counts
        text flow and cuts those elements mid-render, and even a fixed-height clip
        lands mid-line since custom blocks don't share the text's line height — so
        fade the cut edge instead of a hard clip, which reads as intentional
        regardless of what's inside.
      */}
      <div
        className={`flex w-full flex-col items-start gap-2 overflow-hidden text-sm text-text-secondary ${
          isClampable && !expanded
            ? "max-h-30 [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]"
            : ""
        }`}
      >
        {about && <p>{about}</p>}
        {longDescription && (
          // long_description is CMS-authored rich text from the provider dashboard, not user input
          <div className="[&_p]:m-0" dangerouslySetInnerHTML={{ __html: longDescription }} />
        )}
      </div>

      {isClampable && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="text-sm font-medium text-text-brand"
        >
          {expanded ? t("common.readLess") : t("common.readMore")}
        </button>
      )}
    </section>
  );
}
