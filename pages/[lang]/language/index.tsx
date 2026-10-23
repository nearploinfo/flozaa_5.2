import type { GetServerSideProps } from "next";
import { LanguageView } from "@/components/account/language-view";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";

interface PageProps {
  translation: TranslationPageProps;
}

export default function LanguagePage() {
  return <LanguageView />;
}

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      const translation = await getTranslationProps(lang);
      if (!translation) return { notFound: true };
      return { props: { translation } };
    }
  : undefined;
