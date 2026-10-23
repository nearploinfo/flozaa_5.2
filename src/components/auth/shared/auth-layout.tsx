"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AuthHeader } from "@/components/auth/shared/auth-header";
import { AuthFooter } from "@/components/auth/shared/auth-footer";

/**
 * Shared chrome for the sign-in/sign-up modals. Header and footer stay put
 * across step changes — only the body between them slides/fades, keyed by
 * `stepKey` so the modal doesn't visibly jump as a whole.
 */
export function AuthLayout({
  title,
  description,
  onClose,
  onBack,
  backLabel,
  footer = false,
  stepKey,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  onBack?: () => void;
  backLabel?: string;
  footer?: boolean;
  stepKey: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <AuthHeader title={title} description={description} onClose={onClose} onBack={onBack} backLabel={backLabel} />
      <div className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stepKey}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
      {footer && <AuthFooter />}
    </div>
  );
}
