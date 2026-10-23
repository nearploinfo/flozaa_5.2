import type { ComponentType, SVGProps } from "react";
import { FormFieldLabel } from "@/components/auth/shared/form-field-label";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export function TextField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  autoFocus,
  autoComplete,
  disabled,
  required = true,
  leftIcon: LeftIcon,
}: {
  label: string;
  type?: "text" | "email";
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  leftIcon?: IconComponent;
}) {
  const input = (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      autoComplete={autoComplete}
      disabled={disabled}
      className={
        LeftIcon
          ? "flex-1 bg-transparent text-base text-form-field-text placeholder:text-form-field-placeholder focus:outline-none disabled:cursor-not-allowed"
          : "w-full rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-base text-form-field-text placeholder:text-form-field-placeholder focus:border-form-field-focus focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      }
    />
  );

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <FormFieldLabel label={label} required={required} />
      {LeftIcon ? (
        <div className="flex w-full items-center gap-3 rounded-xl border border-border-default bg-bg-primary px-4 py-3 has-[input:disabled]:opacity-60">
          <LeftIcon className="size-5 shrink-0 text-icon-primary" />
          {input}
        </div>
      ) : (
        input
      )}
    </div>
  );
}
