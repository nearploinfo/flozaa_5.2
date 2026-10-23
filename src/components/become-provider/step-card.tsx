import { translated, translatedDescription, type HowItWorkStepApi } from "@/lib/become-provider";

export function StepCard({ data, number }: { data: HowItWorkStepApi; number: number }) {
  const label = number.toString().padStart(2, "0");

  return (
    <div className="group flex h-full w-full items-center gap-5 rounded-3xl border border-border-default bg-bg-primary p-6 md:p-10">
      <span className="shrink-0 text-5xl leading-tight font-bold text-border-strong transition-colors duration-300 group-hover:text-text-brand md:text-7xl md:leading-24">
        {label}
      </span>

      <span className="h-16 w-px shrink-0 bg-border-default md:h-24" />

      <div className="flex flex-1 flex-col gap-2 md:gap-4">
        <h3 className="text-lg font-medium text-text-primary md:text-xl">{translated(data)}</h3>
        <p className="text-sm text-text-primary md:text-base">{translatedDescription(data)}</p>
      </div>
    </div>
  );
}
