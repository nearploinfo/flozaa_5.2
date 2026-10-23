import { useEffect } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { siteConfig } from "@/lib/site-config";

// Legacy /home URL — redirect to the real home route at "/".
export default function HomeRoutePage() {
  const router = useRouter();
  useEffect(() => {
    const lang = router.query.lang as string | undefined;
    router.replace(lang ? `/${lang}` : "/");
  }, [router]);
  return null;
}

export const getServerSideProps: GetServerSideProps | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      return {
        redirect: {
          destination: `/${lang}`,
          permanent: true,
        },
      };
    }
  : undefined;
