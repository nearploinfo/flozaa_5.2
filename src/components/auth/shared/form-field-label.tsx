export function FormFieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="flex items-center justify-start gap-1">
      <span className="text-base text-form-field-label">{label}</span>
      {required && <span className="text-sm text-form-field-error">*</span>}
    </span>
  );
}
