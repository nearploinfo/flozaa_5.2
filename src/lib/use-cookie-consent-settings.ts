import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";

interface CookieConsentSettings {
  /** Admin can turn the whole banner/dialog off for non-EU deployments.
   * "loading" until settings arrive — callers must not treat that as "disabled". */
  status: "loading" | "enabled" | "disabled";
  title: string;
  description: string;
}

const LOADING: CookieConsentSettings = { status: "loading", title: "", description: "" };

export function useCookieConsentSettings(): CookieConsentSettings {
  const webSettings = useAppSelector((state) => state.settings.data?.web_settings) as
    | { cookie_consent_status?: number | string; cookie_consent_title?: string; cookie_consent_description?: string }
    | undefined;

  // `settings` is redux-persisted (localStorage), so the client's very first
  // render can already have data the server never saw — report "loading"
  // until after mount so hydration always starts from the same markup.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-mount gate to avoid hydration mismatch against redux-persist's localStorage state, not derivable from props/state
    setMounted(true);
  }, []);

  if (!mounted || !webSettings) return LOADING;

  const enabled = webSettings.cookie_consent_status === 1 || webSettings.cookie_consent_status === "1";
  return {
    status: enabled ? "enabled" : "disabled",
    title: webSettings.cookie_consent_title || "",
    description: webSettings.cookie_consent_description || "",
  };
}
