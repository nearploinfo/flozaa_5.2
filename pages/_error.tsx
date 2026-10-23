import type { NextPageContext } from "next";
import { LangLayout } from "@/components/layout/lang-layout";
import { SomethingWentWrong } from "@/components/layout/something-went-wrong";
import { defaultLocale } from "@/lib/i18n/locales";

// Same reasoning as pages/404.tsx: _app.tsx excludes "/_error" from the
// getServerSideProps-fed <LangLayout> it wraps every other page in, so this
// page wraps itself with translation={null} to resolve client-side instead.
function Error() {
  return (
    <LangLayout translation={null} lang={defaultLocale}>
      <SomethingWentWrong />
    </LangLayout>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

export default Error;
