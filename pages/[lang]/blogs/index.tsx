import type { GetServerSideProps } from "next";
import BlogsView from "@/components/blogs/BlogsView";
import { MetaData } from "@/components/seo/MetaData";
import { getBlogCategoriesApi, getBlogTagsApi, getBlogsApi } from "@/api/apiRoutes";
import { toApiList, type BlogCategoryApi, type BlogListItemApi, type BlogTagApi } from "@/lib/blogs-catalog";
import { fetchSeoSettings, type SeoSettings } from "@/lib/seo";
import { coordsFromCookies } from "@/lib/location-cookie";
import { runWithSsrLocale } from "@/lib/i18n/ssr-locale-context";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { useTranslation } from "@/lib/i18n/translation-context";

const BLOGS_PAGE_SIZE = 30;

interface PageProps {
  translation: TranslationPageProps;
  blogs: BlogListItemApi[];
  categories: BlogCategoryApi[];
  tags: BlogTagApi[];
  seo: SeoSettings | null;
}

export default function BlogsPage(props: Partial<PageProps>) {
  const { languages, lang, defaultLocale } = useTranslation();
  return (
    <>
      {props.seo && (
        <MetaData
          seo={props.seo}
          pageName="/blogs"
          languages={languages}
          lang={lang}
          defaultLocale={defaultLocale}
        />
      )}
      <BlogsView
        initialBlogs={props.blogs}
        initialCategories={props.categories}
        initialTags={props.tags}
      />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      return runWithSsrLocale(lang, async () => {
        const translation = await getTranslationProps(lang);
        if (!translation) return { notFound: true };

        const [blogsResponse, categoriesResponse, tagsResponse, seo] = await Promise.all([
          getBlogsApi({ limit: BLOGS_PAGE_SIZE, offset: 0 }).catch(() => null),
          getBlogCategoriesApi().catch(() => null),
          getBlogTagsApi().catch(() => null),
          fetchSeoSettings("blogs", null, coordsFromCookies(context.req.cookies)),
        ]);

        return {
          props: {
            translation,
            blogs: toApiList<BlogListItemApi>(blogsResponse),
            categories: toApiList<BlogCategoryApi>(categoriesResponse),
            tags: toApiList<BlogTagApi>(tagsResponse),
            seo,
          },
        };
      });
    }
  : undefined;
