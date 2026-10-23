import type { GetServerSideProps } from "next";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { CartView } from "@/components/cart/cart-view";

interface PageProps {
  translation: TranslationPageProps;
}

export default function CartPage() {
  return <CartView />;
}

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      const translation = await getTranslationProps(lang);
      if (!translation) return { notFound: true };
      return { props: { translation } };
    }
  : undefined;
