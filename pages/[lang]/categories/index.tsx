import type { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { CategoriesView } from "@/components/categories/categories-view";
import type { CategoryTreeNode } from "@/lib/categories-tree-api";
import { getCategoryApi } from "@/api/apiRoutes";
import type { CategoryApi } from "@/lib/home-screen";
import { useAppSelector } from "@/store/hooks";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";

interface PageProps {
  translation: TranslationPageProps;
}

function toCategoryTreeNode(category: CategoryApi): CategoryTreeNode {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    image: category.category_image ?? category.image ?? "",
    providerCount: category.total_providers,
    serviceCount: category.total_services,
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);

  useEffect(() => {
    getCategoryApi({
      ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
    }).then((response) => {
      const list: CategoryApi[] = response?.error ? [] : (response?.data ?? []);
      setCategories(list.map(toCategoryTreeNode));
      setLoading(false);
    });
  }, [lat, lng]);

  return <CategoriesView categories={categories} loading={loading} />;
}

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      const translation = await getTranslationProps(lang);
      if (!translation) return { notFound: true };
      return { props: { translation } };
    }
  : undefined;
