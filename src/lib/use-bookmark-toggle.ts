import { useState } from "react";
import { toast } from "sonner";
import { addBookmarkApi, removeBookmarkApi, type BookmarkType } from "@/api/apiRoutes";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useRequireAuth } from "@/lib/use-require-auth";

export function useBookmarkToggle({
  type,
  id,
  initialBookmarked = false,
  onToggled,
}: {
  type: BookmarkType;
  id: string | number;
  initialBookmarked?: boolean;
  /** Fired only after a successful add/remove — not on failure (state reverts instead). */
  onToggled?: (bookmarked: boolean) => void;
}) {
  const { t } = useTranslation();
  const { requireAuth } = useRequireAuth();
  // Cards keep a stable `key` (id) across re-renders, so this hook never
  // remounts when the parent's underlying data refreshes (e.g. the home
  // page's SSR pass runs unauthenticated, then a client refetch after
  // hydration corrects `is_bookmarked` for the logged-in user). Tracking
  // only the local override — falling back to `initialBookmarked` until the
  // user actually toggles — means a later prop change is picked up for
  // free instead of freezing at whatever `initialBookmarked` was on mount.
  const [override, setOverride] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const bookmarked = override ?? initialBookmarked;

  const toggle = () => requireAuth(() => performToggle());

  const performToggle = async () => {
    if (pending) return;

    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      toast.error(t("common.bookmark.error"));
      return;
    }

    const previousBookmarked = bookmarked;
    const nextBookmarked = !bookmarked;
    setOverride(nextBookmarked);
    setPending(true);

    const params = {
      bookmark_type: type,
      ...(type === "service" ? { service_id: numericId } : { partner_id: numericId }),
    };

    try {
      const response = await (nextBookmarked ? addBookmarkApi(params) : removeBookmarkApi(params));
      if (response?.error) throw new Error(response?.message);
      toast.success(
        nextBookmarked ? t("common.bookmark.addSuccess") : t("common.bookmark.removeSuccess")
      );
      onToggled?.(nextBookmarked);
    } catch {
      setOverride(previousBookmarked);
      toast.error(t("common.bookmark.error"));
    } finally {
      setPending(false);
    }
  };

  return { bookmarked, toggle, pending };
}
