import { SparkleStarIcon } from "@/components/icons/icons";

export function HighlightTag({ text, inverse }: { text: string; inverse?: boolean }) {
  return (
    <div
      className={`flex w-fit items-center justify-center gap-2 rounded-sm p-2 ${
        inverse ? "bg-white/20" : "bg-bg-brand/10"
      }`}
    >
      <SparkleStarIcon className={`size-5 shrink-0 ${inverse ? "text-white" : "text-text-brand"}`} />
      <span className={`text-sm font-medium md:text-base ${inverse ? "text-white" : "text-text-brand"}`}>
        {text}
      </span>
      <SparkleStarIcon className={`size-5 shrink-0 ${inverse ? "text-white" : "text-text-brand"}`} />
    </div>
  );
}
