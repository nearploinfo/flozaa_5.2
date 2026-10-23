import type { GetServerSideProps } from "next";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { withAuth } from "@/lib/with-auth";

interface PageProps {
  translation: TranslationPageProps;
}

function Page() {
  return <CheckoutView />;
}

export default withAuth(Page);

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      const translation = await getTranslationProps(lang);
      if (!translation) return { notFound: true };
      return { props: { translation } };
    }
  : undefined;
