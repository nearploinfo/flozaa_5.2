"use client";

import { TriangleAlert } from "lucide-react";

/** Boxed error banner shared by every auth step (wrong password, wrong OTP,
 * account deactivated, etc.) — replaces a bare red text line. */
export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex w-full items-start gap-2 rounded-lg border border-border-error/20 bg-alert-error-bg p-3">
      <TriangleAlert className="size-4 shrink-0 text-alert-error-text" />
      <p className="text-sm text-alert-error-text">{message}</p>
    </div>
  );
}
