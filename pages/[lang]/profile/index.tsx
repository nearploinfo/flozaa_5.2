import type { GetServerSideProps } from "next";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { ProfileForm } from "@/components/account/profile-form";
import { useTranslation } from "@/lib/i18n/translation-context";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import ProfileLayout from "@/components/account/ProfileLayout";
import { withAuth } from "@/lib/with-auth";

interface PageProps {
  translation: TranslationPageProps;
}

function ProfilePage() {
  const { t } = useTranslation();
  const title = t("account.myProfile");

  return (
    <>
      <PageBreadcrumb title={title} items={[{ label: title }]} />
      <ProfileLayout title={t("account.profile.editTitle")}>
        <ProfileForm />
      </ProfileLayout>
    </>
  );
}

export default withAuth(ProfilePage);

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
    const lang = context.params?.lang as string;
    const translation = await getTranslationProps(lang);
    if (!translation) return { notFound: true };
    return { props: { translation } };
  }
  : undefined;
