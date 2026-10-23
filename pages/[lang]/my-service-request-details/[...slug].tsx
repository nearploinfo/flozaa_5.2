import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { ServiceRequestDetailsView } from "@/components/account/service-request-details-view";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { withAuth } from "@/lib/with-auth";

interface PageProps {
  translation: TranslationPageProps;
}

function Page() {
  const router = useRouter();
  const slug = Array.isArray(router.query.slug) ? router.query.slug[0] : undefined;

  if (!slug) return null;

  return <ServiceRequestDetailsView id={slug} />;
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
