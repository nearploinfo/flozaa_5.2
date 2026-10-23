import type { GetServerSideProps } from "next";
import { PaymentHistoryView } from "@/components/account/payment-history-view";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { withAuth } from "@/lib/with-auth";

interface PageProps {
  translation: TranslationPageProps;
}

function PaymentHistoryPage() {
  return <PaymentHistoryView />;
}

export default withAuth(PaymentHistoryPage);

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      const translation = await getTranslationProps(lang);
      if (!translation) return { notFound: true };
      return { props: { translation } };
    }
  : undefined;
