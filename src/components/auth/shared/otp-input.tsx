"use client";

import { useEffect, useRef } from "react";

const OTP_LENGTH = 6;

export function OtpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? "");

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, OTP_LENGTH));
  };

  return (
    <div className="flex items-center justify-center gap-2 self-stretch sm:gap-4">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(event) => {
            const char = event.target.value.replace(/\D/g, "").slice(-1);
            setDigit(index, char);
            if (char && index < OTP_LENGTH - 1) {
              inputRefs.current[index + 1]?.focus();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index] && index > 0) {
              inputRefs.current[index - 1]?.focus();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
            if (!pasted) return;
            onChange(pasted);
            inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
          }}
          className={
            digit
              ? "size-11 shrink-0 rounded-sm border border-form-field-focus bg-form-field-bg text-center text-base text-form-field-text shadow-[0px_0px_0px_3px_rgba(0,121,255,0.10)] outline-none sm:size-12"
              : "size-11 shrink-0 rounded-sm border border-form-field-border bg-bg-secondary text-center text-base text-form-field-text outline-none focus:border-form-field-focus sm:size-12"
          }
        />
      ))}
    </div>
  );
}
