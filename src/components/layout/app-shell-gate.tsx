"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader } from "@/components/layout/loader";
import { siteConfig } from "@/lib/site-config";

// Shows the main app loader alone (no Header/Footer/nav — this wraps all of
// them) for the first client tick under static export, where the initial
// HTML has no SSR data yet. Once mounted, reveals the real layout; each
// page's own view then shows section-based skeletons while its data loads,
// instead of blocking behind this loader again.
export function AppShellGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(siteConfig.seoEnabled);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, []);

  if (!ready) return <Loader />;

  return children;
}
