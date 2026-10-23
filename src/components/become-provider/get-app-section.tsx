import { AppStoreIcon, PlayStoreIcon } from "@/components/icons/icons";
import { Link } from "@/components/ui/locale-link";
import { useTranslation } from "@/lib/i18n/translation-context";
import { siteConfig } from "@/lib/site-config";
import { useProviderAppLinks } from "@/lib/become-provider";

function LeftBlobShape() {
  return (
    <svg
      viewBox="0 0 130 278"
      preserveAspectRatio="none"
      className="pointer-events-none absolute top-0 left-0 hidden h-full w-auto text-bg-brand xl:block"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M114.299 145.245C141.192 186.781 127.68 248.55 112.866 278H58.6272H-1.57839V139.5V9.22939e-05C-7.02701 -2.80303e-05 -1.57839 3.81494e-06 -1.57839 3.81494e-06V9.22939e-05C1.28044 0.000155427 7.13928 0.000260452 18.3592 0.00043395C43.3496 0.000820383 95.6623 9.67204e-05 119.078 2.62628e-06C120.287 -2.23131e-06 77.8895 40.5894 42.6185 75.8604C14.4789 104 88.1225 104.814 114.299 145.245Z"
        fill="currentColor"
      />
    </svg>
  );
}

function RightBlobShape() {
  return (
    <svg
      viewBox="0 0 129 278"
      preserveAspectRatio="none"
      className="pointer-events-none absolute top-0 right-0 hidden h-full w-auto text-bg-brand xl:block"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.3197 132.755C-11.4321 91.2194 2.00906 29.4498 16.7456 0H70.7005H130.591V138.5V278C136.011 278 130.591 278 130.591 278V278C127.747 278 121.919 278 110.758 278C85.8982 277.999 33.8592 278 10.566 278C9.3635 278 51.5391 237.411 86.6255 202.14C114.618 174 41.3596 173.186 15.3197 132.755Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function GetAppSection() {
  const { t } = useTranslation();
  const { appStoreUrl, playStoreUrl } = useProviderAppLinks();

  if (!appStoreUrl && !playStoreUrl) return null;

  return (
    <section className="relative">
      {/* Pulled up to sit partly inside the preceding section's own bottom padding
          (py-*-20 = 80px), so the box visually attaches to it instead of floating
          in a separate strip of plain background below. */}
      <div className="container mx-auto -mt-6 md:-mt-12">
        <div className="relative overflow-hidden rounded-3xl bg-black px-4 py-14 md:px-8 lg:px-12">
          <LeftBlobShape />
          <RightBlobShape />

          <div className="relative z-10 mx-auto flex flex-col items-center justify-center gap-4 text-center">
            <span className="w-full text-xl leading-8 font-bold text-white xl:w-1/2 xl:text-4xl xl:leading-12">
              {t("becomeProviderPage.appCtaTitle", { appName: siteConfig.appName })}
            </span>
            <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
              {playStoreUrl && (
                <Link
                  href={playStoreUrl}
                  target="_blank"
                  className="flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-white/25 px-3 text-base font-bold text-white sm:h-14 sm:w-auto sm:min-w-44 sm:text-xl"
                >
                  <PlayStoreIcon className="size-6 shrink-0 sm:size-8" />
                  <span>{t("footer.googlePlay")}</span>
                </Link>
              )}
              {appStoreUrl && (
                <Link
                  href={appStoreUrl}
                  target="_blank"
                  className="flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-white/25 px-3 text-base font-bold text-white sm:h-14 sm:w-auto sm:min-w-44 sm:text-xl"
                >
                  <AppStoreIcon className="size-6 shrink-0 sm:size-8" />
                  <span>{t("footer.appStore")}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
