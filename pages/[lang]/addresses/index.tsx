import type { GetServerSideProps } from "next";
import { AddressesView } from "@/components/account/addresses-view";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { withAuth } from "@/lib/with-auth";

interface PageProps {
  translation: TranslationPageProps;
}

function AddressesPage() {
  return <AddressesView />;
}

export default withAuth(AddressesPage);

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      const translation = await getTranslationProps(lang);
      if (!translation) return { notFound: true };
      return { props: { translation } };
    }
  : undefined;
