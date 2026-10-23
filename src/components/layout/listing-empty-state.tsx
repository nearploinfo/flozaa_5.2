import { AppButton } from "@/components/ui/app-button";
import { SearchNoResultsIllustration } from "@/components/layout/search-no-results-illustration";

// Shared "no results" state for card listings (/services, /providers) —
// same markup, only the copy and reset handler differ per page. Also covers
// both a plain search with no matches and filters that exclude everything —
// same illustration/copy shape either way.
export function ListingEmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 py-10 text-center sm:py-16">
      <SearchNoResultsIllustration className="h-32 w-28 sm:h-44 sm:w-40" />
      <div className="flex flex-col gap-1">
        <span className="text-lg font-medium text-text-primary">{title}</span>
        <span className="text-base text-text-secondary">{message}</span>
      </div>
      <AppButton
        variant="secondary-outline"
        onClick={onAction}
        className="rounded-lg border-border-default text-text-primary hover:bg-bg-secondary"
      >
        {actionLabel}
      </AppButton>
    </div>
  );
}
