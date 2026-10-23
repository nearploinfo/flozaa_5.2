import { useRouter } from "next/router";

// Pages Router has no next/navigation — these reproduce the three App
// Router hooks this codebase's client components were written against,
// backed by next/router's useRouter() instead.

// usePathname(): real browser path, no query string (matches next/navigation).
//
// router.asPath starts out as the literal unresolved route pattern (e.g.
// "/[lang]") on initial load of a dynamic page, only corrected to the real
// path asynchronously after mount. A real browser path never contains "["
// or "]" — if we still see one, fall back to the actual URL instead of the
// stale/literal router value.
export function usePathnameCompat(): string {
  const router = useRouter();
  const path = router.asPath.split("?")[0].split("#")[0];
  if (
    (path.includes("[") || path.includes("]")) &&
    typeof window !== "undefined"
  ) {
    return window.location.pathname;
  }
  return path;
}

// useSearchParams(): only .toString() is used anywhere in this codebase
// (as a change-detection key, never .get()). Must come from the actual
// URL query string — router.query also merges in the route's own dynamic
// segment params (e.g. `lang`), which aren't real query params and would
// never match a query string callers build themselves, causing an
// infinite router.replace() loop (qs !== searchParams.toString() forever).
export function useSearchParamsCompat(): URLSearchParams {
  const router = useRouter();
  const queryString = router.asPath.split("?")[1]?.split("#")[0] ?? "";
  return new URLSearchParams(queryString);
}

// useParams<{ lang?: string }>(): router.query already has this shape once
// the route has resolved.
export function useParamsCompat<T extends Record<string, string | undefined>>(): T {
  const router = useRouter();
  return router.query as unknown as T;
}
