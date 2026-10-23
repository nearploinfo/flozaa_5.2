import { ProviderCard } from "@/components/home/provider-card";
import type { NearbyProvider } from "@/lib/providers-catalog";

export function ProviderGridSection({
  title,
  description,
  providers,
}: {
  title: string;
  description: string;
  providers: NearbyProvider[];
}) {
  return (
    <section className="bg-bg-secondary py-16">
      <div className="container flex flex-col gap-7">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-medium text-text-primary">{title}</h2>
          <p className="text-lg text-text-secondary">{description}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} style="style-1" />
          ))}
        </div>
      </div>
    </section>
  );
}
