import { CheckCircleIcon } from "@/components/icons/icons";
import type { LoginSettings } from "@/lib/auth-settings";
import { useTranslation } from "@/lib/i18n/translation-context";
import { cn } from "@/lib/utils";

type Translate = (key: string, vars?: Record<string, string | number>) => string;

function buildRules(
  settings: LoginSettings,
  t: Translate
): { label: string; test: (password: string) => boolean }[] {
  const rules: { label: string; test: (password: string) => boolean }[] = [
    {
      label: t("auth.password.rules.length", { count: settings.minimum_password_length }),
      test: (p) => p.length >= settings.minimum_password_length,
    },
  ];
  if (settings.require_at_least_one_uppercase) {
    rules.push({ label: t("auth.password.rules.uppercase"), test: (p) => /[A-Z]/.test(p) });
  }
  if (settings.require_at_least_one_lowercase) {
    rules.push({ label: t("auth.password.rules.lowercase"), test: (p) => /[a-z]/.test(p) });
  }
  if (settings.require_at_least_one_number) {
    rules.push({ label: t("auth.password.rules.number"), test: (p) => /[0-9]/.test(p) });
  }
  if (settings.require_at_least_one_special_character) {
    rules.push({
      label: t("auth.password.rules.special"),
      test: (p) => /[!@#%^&*]/.test(p),
    });
  }
  return rules;
}

export function passwordMeetsAllRules(
  password: string,
  settings: LoginSettings,
  t: Translate
): boolean {
  return buildRules(settings, t).every((rule) => rule.test(password));
}

export function PasswordStrengthChecklist({
  password,
  settings,
}: {
  password: string;
  settings: LoginSettings;
}) {
  const { t } = useTranslation();
  const rules = buildRules(settings, t);
  const segmentCount = rules.length;
  const metCount = rules.filter((rule) => rule.test(password)).length;
  const ratio = segmentCount > 0 ? metCount / segmentCount : 0;

  const tier = ratio >= 1 ? "strong" : ratio >= 0.5 ? "medium" : "weak";
  const tierClass = {
    strong: { bar: "bg-bg-brand", pillBg: "bg-bg-brand-subtle", pillText: "text-text-brand" },
    medium: { bar: "bg-bg-warning", pillBg: "bg-bg-warning-subtle", pillText: "text-text-warning" },
    weak: { bar: "bg-bg-error", pillBg: "bg-bg-error-subtle", pillText: "text-text-error" },
  }[tier];
  const filledSegments = password ? metCount : 0;

  return (
    <>
      {/* Mobile — bar + wrapped chips, flush against the password field above. */}
      <div className="-mt-px flex w-full flex-col items-start gap-2 rounded-t-none rounded-b-sm border border-t-0 border-form-field-border bg-bg-secondary p-2 xl:hidden">
        <div className="flex w-full items-center gap-6">
          <div className="flex h-1 flex-1 items-center gap-1">
            {Array.from({ length: segmentCount }).map((_, index) => (
              <span
                key={index}
                className={cn("h-1 flex-1 rounded-lg", index < filledSegments ? tierClass.bar : "bg-border-default")}
              />
            ))}
          </div>
          {password && (
            <span className={cn("shrink-0 rounded-lg px-1 py-0.5 text-xs", tierClass.pillBg, tierClass.pillText)}>
              {t(`auth.password.strength.${tier}`)}
            </span>
          )}
        </div>
        <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1">
          {rules.map(({ label, test }) => {
            const met = test(password);
            return (
              <span key={label} className="flex items-center gap-1">
                <CheckCircleIcon className={met ? "size-4 text-icon-brand" : "size-4 text-icon-tertiary"} />
                <span className={cn("text-xs", met ? "text-text-primary" : "text-text-secondary")}>{label}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Desktop — unchanged plain vertical checklist, detached from the field. */}
      <div className="hidden w-full flex-col items-start gap-1 xl:flex">
        {rules.map(({ label, test }) => {
          const met = test(password);
          return (
            <span key={label} className="flex items-center gap-2">
              <CheckCircleIcon className={met ? "size-4 text-icon-brand" : "size-4 text-icon-tertiary"} />
              <span className={cn("line-clamp-1 text-sm", met ? "text-text-primary" : "text-text-secondary")}>
                {label}
              </span>
            </span>
          );
        })}
      </div>
    </>
  );
}
