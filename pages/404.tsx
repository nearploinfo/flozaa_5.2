import NextLink from "next/link";
import { NotFoundIllustration } from "@/components/common/not-found-illustration";
import { LangLayout } from "@/components/layout/lang-layout";
import { defaultLocale } from "@/lib/i18n/locales";

// _app.tsx excludes "/404" from the getServerSideProps-fed <LangLayout> it
// wraps every other page in (no translation prop is ever fetched for this
// route) — so this page wraps itself, passing translation={null} to make
// LangLayout resolve it client-side from `defaultLocale` instead. That's
// also why this stays plain English and uses next/link directly rather
// than the locale-aware <Link> (no TranslationProvider until LangLayout
// itself renders one below).
export default function NotFound() {
  return (
    <LangLayout translation={null} lang={defaultLocale}>
      <div className="flex min-h-[679px] w-full flex-col items-center justify-center gap-10 bg-bg-primary px-6 py-16 lg:px-36">
        <NotFoundIllustration className="h-auto w-72 text-icon-brand lg:w-96" />

        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-2xl font-medium text-text-primary lg:text-3xl">
            Oops! Page Not Found
          </h1>
          <p className="text-base text-text-secondary lg:text-xl">
            The page you&apos;re looking for may have been moved, removed, or is no longer
            available. Let&apos;s get you back on track.
          </p>
          <NextLink
            href={`/${defaultLocale}`}
            className="mt-2 rounded-lg bg-button-primary-bg px-6 py-2 text-base text-button-primary-text hover:bg-button-primary-hover"
          >
            Back to Home
          </NextLink>
        </div>
      </div>
    </LangLayout>
  );
}
