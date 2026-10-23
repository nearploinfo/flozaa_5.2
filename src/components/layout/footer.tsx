"use client";

import { Link } from "@/components/ui/locale-link";
import { Clock, MapPin, Mail, Phone, Cookie } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import whiteLogo from "@/assets/brand/white_logo.svg";
import { PlayStoreIcon, AppStoreIcon, DoubleChevronRightIcon } from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useCustomPages } from "@/lib/use-custom-pages";
import { useConsent } from "@/lib/consent-context";
import { useCookieConsentSettings } from "@/lib/use-cookie-consent-settings";
import { useCustomerAppLinks } from "@/lib/use-customer-app-links";
import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { siteConfig } from "@/lib/site-config";

interface FooterGeneralSettings {
  phone?: string;
  support_email?: string;
  support_hours?: string;
  address?: string;
  translated_address?: string;
  copyright_details?: string;
  translated_copyright_details?: string;
  short_description?: string;
  translated_short_description?: string;
}

interface FooterWebSettings {
  footer_logo?: string;
}

/** Admin can add any number of these (Settings > Social Media Links) — each
 * a URL + a custom-uploaded icon (recommended 30x30px), not a fixed
 * platform list. Entries with no URL filled in yet are placeholders, not
 * live links — skip them. */
interface SocialMediaLink {
  url?: string;
  file?: string;
}

const QUICK_LINKS = [
  { labelKey: "nav.services", href: "/services" },
  { labelKey: "nav.providers", href: "/providers" },
  { labelKey: "nav.blogs", href: "/blogs" },
  { labelKey: "nav.faqs", href: "/faqs" },
  { labelKey: "footer.becomeAnProvider", href: "/become-provider" },
];

// Under static export (SEO=false) the human-readable /sitemap page's data
// only loads in getServerSideProps, which never runs — it renders empty.
// Point straight at the real static sitemap.xml instead. That file is a
// single root-level file, not locale-scoped, so it's marked `external` to
// skip the locale-prefixing Link wrapper.
const COMPANY_LINKS = [
  { labelKey: "nav.aboutUs", href: "/about-us" },
  { labelKey: "nav.contactUs", href: "/contact-us" },
  siteConfig.seoEnabled
    ? { labelKey: "nav.sitemap", href: "/sitemap" }
    : { labelKey: "nav.sitemap", href: "/sitemap.xml", external: true },
  { labelKey: "footer.termsAndConditions", href: "/terms-and-conditions" },
  { labelKey: "nav.privacyPolicy", href: "/privacy-policy" },
];

// Footer is always a dark surface, regardless of the app's light/dark theme
// (verified: using the theme-reactive Background/Inverse + Text/Inverse Light
// tokens here flips the footer to a white bg in dark mode while link/copy text
// stays white too, making it invisible). Fixed Footer component tokens only, below.

function FooterColumn({
  title,
  links,
}: {
  title: string;
  /** Either a translation key (fixed nav links) or a raw label (admin-created
   * custom pages — already server-translated by `translated_title`). `external`
   * skips the locale-prefixing Link wrapper for root-level, non-locale-scoped
   * targets (e.g. /sitemap.xml). */
  links: { labelKey?: string; label?: string; href: string; external?: boolean }[];
}) {
  const { t } = useTranslation();
  const linkClassName =
    "flex items-center gap-1 text-base text-footer-light-text underline decoration-transparent underline-offset-4 transition-all duration-300 ease-out hover:translate-x-1.5 hover:decoration-footer-light-text";
  return (
    <div className="flex flex-1 flex-col items-start gap-6 pt-6">
      <div className="w-fit border-b border-footer-white pb-1">
        <span className="text-lg font-medium text-footer-light-text">
          {title}
        </span>
      </div>
      <ul className="flex w-full flex-col items-start gap-3">
        {links.map((link) => (
          <li key={link.href} className="w-full">
            {link.external ? (
              <a href={link.href} className={linkClassName}>
                <DoubleChevronRightIcon className="size-3.5 shrink-0 rtl:rotate-180" />
                {link.label ?? t(link.labelKey as string)}
              </a>
            ) : (
              <Link href={link.href} className={linkClassName}>
                <DoubleChevronRightIcon className="size-3.5 shrink-0 rtl:rotate-180" />
                {link.label ?? t(link.labelKey as string)}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const { t } = useTranslation();
  const { pages: customPages } = useCustomPages();
  const { reopenSettings } = useConsent();
  const { status: cookieConsentStatus } = useCookieConsentSettings();
  const { playStoreUrl, appStoreUrl } = useCustomerAppLinks();
  const hasHydrated = useHasHydrated();
  const persistedGeneralSettings = useAppSelector(
    (state) => state.settings.data?.general_settings
  ) as FooterGeneralSettings | undefined;
  const generalSettings = hasHydrated ? persistedGeneralSettings : undefined;
  const address = generalSettings?.translated_address || generalSettings?.address;
  const copyright =
    generalSettings?.translated_copyright_details || generalSettings?.copyright_details;
  const tagline =
    generalSettings?.translated_short_description || generalSettings?.short_description;
  const persistedWebSettings = useAppSelector((state) => state.settings.data?.web_settings) as
    | (FooterWebSettings & { social_media?: SocialMediaLink[] })
    | undefined;
  const webSettings = hasHydrated ? persistedWebSettings : undefined;
  const footerLogo = webSettings?.footer_logo || whiteLogo;
  const socialLinks = (webSettings?.social_media ?? []).filter(
    (social): social is SocialMediaLink & { url: string } => Boolean(social.url)
  );
  const customPageLinks = customPages.map((page) => ({
    label: page.title,
    href: `/custom-page/${page.slug}`,
  }));

  return (
    <footer className="bg-footer-main-bg pt-16 pb-16 max-xl:hidden">
      <div className="container flex flex-col gap-6">
        <div className="flex flex-col items-start gap-6 lg:flex-row">
          <div className="flex w-full flex-col items-start gap-6 py-6 lg:w-96 lg:shrink-0">
            <Link href="/" className="flex items-center">
              <AppImage src={footerLogo} alt={siteConfig.appName} className="h-11 w-auto" />
            </Link>
            {tagline && (
              <p className="text-base text-footer-light-text">{tagline}</p>
            )}

            {(playStoreUrl || appStoreUrl) && (
              <div className="flex flex-col items-start gap-4">
                <span className="text-base font-medium text-footer-light-text">
                  {t("footer.downloadApp")}
                </span>
                <div className="flex flex-wrap items-start gap-4">
                  {playStoreUrl && (
                    <Link
                      href={playStoreUrl}
                      className="flex items-center gap-3 rounded-lg p-3 text-lg text-footer-light-text transition-colors duration-200 hover:bg-footer-light-bg hover:text-footer-dark-text"
                    >
                      <PlayStoreIcon className="h-7 w-6" />
                      {t("footer.googlePlay")}
                    </Link>
                  )}
                  {appStoreUrl && (
                    <Link
                      href={appStoreUrl}
                      className="flex items-center gap-3 rounded-lg p-3 text-lg text-footer-light-text transition-colors duration-200 hover:bg-footer-light-bg hover:text-footer-dark-text"
                    >
                      <AppStoreIcon className="h-7 w-6" />
                      {t("footer.appStore")}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          <FooterColumn title={t("footer.quickLinks")} links={QUICK_LINKS} />
          <FooterColumn title={t("footer.company")} links={COMPANY_LINKS} />
          {hasHydrated && customPageLinks.length > 0 && (
            <FooterColumn title={t("footer.pages")} links={customPageLinks} />
          )}

          <div className="flex flex-1 flex-col items-start gap-6 pt-6">
            <div className="w-fit border-b border-footer-white pb-1">
              <span className="text-lg font-medium text-footer-light-text">
                {t("footer.contactUs")}
              </span>
            </div>
            <div className="flex w-full flex-col items-start gap-4">
              {generalSettings?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="size-5 shrink-0 text-footer-light-icon" />
                  <span className="text-base text-footer-light-text">{generalSettings.phone}</span>
                </div>
              )}
              {generalSettings?.support_email && (
                <div className="flex items-center gap-3">
                  <Mail className="size-5 shrink-0 text-footer-light-icon" />
                  <span className="text-base text-footer-light-text">{generalSettings.support_email}</span>
                </div>
              )}
              {generalSettings?.support_hours && (
                <div className="flex items-center gap-3">
                  <Clock className="size-5 shrink-0 text-footer-light-icon" />
                  <span className="text-base text-footer-light-text">{generalSettings.support_hours}</span>
                </div>
              )}
              {address && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-footer-light-icon" />
                  <span className="text-base text-footer-light-text">{address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full border-t border-dashed border-footer-light-text/30" />

        <div className="flex flex-col items-center gap-4 pt-6 md:flex-row md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {copyright && (
              <p className="text-base text-footer-light-text">{copyright}</p>
            )}
            {cookieConsentStatus === "enabled" && (
              <button
                type="button"
                onClick={reopenSettings}
                aria-label={t("cookie.settingsLink")}
                title={t("cookie.settingsLink")}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-footer-light-text/70 transition-colors hover:bg-white/10 hover:text-footer-light-text"
              >
                <Cookie className="size-4" />
              </button>
            )}
          </div>
          {socialLinks.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.url}
                  target="_blank"
                  aria-label={social.url}
                  className="flex size-11 shrink-0 items-center justify-center rounded-full border border-footer-light-text/20 p-2 transition-colors duration-200 hover:border-footer-light-text/40 hover:bg-white/10"
                >
                  {social.file ? (
                    <AppImage src={social.file} alt="" className="size-full object-contain" />
                  ) : (
                    <span className="size-full rounded-full bg-footer-light-text/20" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
