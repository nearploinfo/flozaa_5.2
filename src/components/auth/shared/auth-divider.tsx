export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-end gap-2 self-stretch">
      <div className="h-px flex-1 bg-border-default" />
      <span className="text-sm text-text-secondary">{label}</span>
      <div className="h-px flex-1 bg-border-default" />
    </div>
  );
}
