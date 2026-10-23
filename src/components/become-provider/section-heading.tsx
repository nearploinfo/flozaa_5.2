import { HighlightTag } from "@/components/become-provider/highlight-tag";
import { TitleWithHighlight } from "@/components/become-provider/title-highlight";
import { translated, translatedDescription, translatedHeadline } from "@/lib/become-provider";

interface HeadlineData {
  title?: string;
  translated_title?: string;
  description?: string;
  translated_description?: string;
  short_headline?: string;
  translated_short_headline?: string;
}

export function SectionHeading({ headline }: { headline: HeadlineData }) {
  const tag = translatedHeadline(headline);

  return (
    <div className="mx-auto mb-12 flex flex-col items-center justify-center gap-4 text-center">
      {tag && <HighlightTag text={tag} />}
      <span className="mx-auto w-full text-2xl font-bold text-text-primary md:text-4xl xl:w-3/5">
        <TitleWithHighlight title={translated(headline)} />
      </span>
      <p className="mx-auto w-full text-sm font-normal text-text-secondary md:w-[70%] md:text-lg lg:w-1/2">
        {translatedDescription(headline)}
      </p>
    </div>
  );
}
