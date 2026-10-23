import type { GetServerSideProps } from "next";
import BlogDetailsView from "@/components/blogs/BlogDetailsView";
import { BlogDetailsLoader } from "@/components/blogs/BlogDetailsLoader";
import { MetaData } from "@/components/seo/MetaData";
import { fetchBlogDetail, type BlogDetailApi, type BlogListItemApi } from "@/lib/blogs-catalog";
import { fetchSeoSettings, type SeoSettings } from "@/lib/seo";
import { runWithSsrLocale } from "@/lib/i18n/ssr-locale-context";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { useTranslation } from "@/lib/i18n/translation-context";

interface PageProps {
  translation: TranslationPageProps;
  blog: BlogDetailApi | null;
  related: BlogListItemApi[];
  seo: SeoSettings | null;
  slug: string;
}

export default function BlogDetailsPage(props: Partial<PageProps>) {
  const { languages, lang, defaultLocale } = useTranslation();
  // SEO=false (no getServerSideProps ran): blog is always undefined here —
  // BlogDetailsLoader reads the real slug from the live browser URL and
  // fetches client-side (matches the App Router version).
  if (!props.blog) return <BlogDetailsLoader />;
  return (
    <>
      {props.seo && props.slug && (
        <MetaData
          seo={props.seo}
          pageName={`/blog-details/${props.slug}`}
          languages={languages}
          lang={lang}
          defaultLocale={defaultLocale}
        />
      )}
      <BlogDetailsView blog={props.blog} related={props.related ?? []} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      return runWithSsrLocale(lang, async () => {
        const translation = await getTranslationProps(lang);
        if (!translation) return { notFound: true };

        const slug = context.params?.slug as string;
        const [result, seo] = await Promise.all([fetchBlogDetail(slug), fetchSeoSettings("blog-details", slug)]);
        if (!result) return { notFound: true };

        return { props: { translation, blog: result.blog, related: result.related, seo, slug } };
      });
    }
  : undefined;
