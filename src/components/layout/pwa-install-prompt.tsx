"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { AppButton } from "@/components/ui/app-button";
import { useConsent } from "@/lib/consent-context";
import logo from "@/assets/brand/logo.svg";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(false);
  // Cookie settings document this explicitly ("Functional: ... PWA install
  // prompts") — only register the service worker / listen for the install
  // prompt once the visitor has actually granted that category, not just
  // whenever consent is undecided or declined.
  const { consent } = useConsent();
  const functionalGranted = consent?.functional === true;

  useEffect(() => {
    if (!functionalGranted) return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability doesn't require a working service worker; ignore.
      });
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, [functionalGranted]);

  if (!functionalGranted || !installEvent || dismissed) return null;

  const handleInstall = async () => {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === "accepted" || outcome === "dismissed") {
        setInstallEvent(null);
      }
    } catch (error) {
      console.error("Failed to prompt PWA install:", error);
    }
  };

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border-default bg-bg-primary p-4 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.12)] xl:hidden">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-bg-brand-subtle">
        <AppImage src={logo} alt="eDemand" className="size-7" />
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-text-primary">
          Install eDemand App
        </span>
        <span className="text-xs text-text-secondary">
          Add to your home screen for faster, app-like access.
        </span>
      </div>
      <AppButton
        variant="primary"
        iconOnly
        leftIcon={Download}
        onClick={handleInstall}
        aria-label="Install eDemand app"
        className="shrink-0 rounded-lg p-2 text-text-inverse-light"
      >
        Install eDemand app
      </AppButton>
      <AppButton
        variant="link"
        size="sm"
        iconOnly
        leftIcon={X}
        onClick={() => setDismissed(true)}
        aria-label="Dismiss install prompt"
        className="shrink-0 rounded-lg p-2 text-icon-secondary"
      >
        Dismiss install prompt
      </AppButton>
    </div>
  );
}
