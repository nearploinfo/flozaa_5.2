import { AppButton } from "@/components/ui/app-button";
import { cn } from "@/lib/utils";

/** Map-pin-pattern illustration for the "no saved addresses" empty state. */
function AddressesEmptyIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 266" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M0 43.4713C0 32.6657 8.75971 23.9062 19.5653 23.9062H288.785C294.979 23.9062 300 28.9272 300 35.1212V253.995C300 260.188 294.979 265.21 288.785 265.21H26.0868C11.6795 265.21 0 253.532 0 239.124V43.4713Z"
        className="fill-bg-secondary"
      />
      <mask
        id="addresses-empty-mask"
        style={{ maskType: "alpha" }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="23"
        width="300"
        height="243"
      >
        <path
          d="M0 43.4713C0 32.6657 8.75971 23.9062 19.5653 23.9062H291.306C296.106 23.9062 300 27.7992 300 32.6018V256.515C300 261.318 296.106 265.21 291.306 265.21H26.0868C11.6795 265.21 0 253.532 0 239.124V43.4713Z"
          fill="white"
        />
      </mask>
      <g mask="url(#addresses-empty-mask)">
        <path
          d="M204.602 74.9349L237.136 23.9062"
          className="stroke-icon-disabled"
          strokeWidth="6.52175"
        />
        <path d="M0 213.5L65.3857 278.474" className="stroke-icon-disabled" strokeWidth="5.92152" />
        <path
          d="M28.4688 240.859H259.888L241.297 275.766"
          className="stroke-icon-disabled"
          strokeWidth="5.92152"
        />
        <path
          d="M237.926 105.064L216.438 86.0338L157.01 33.4062L13.2773 100.556M216.438 86.0338L96.9869 154.161M326.877 182.599L237.926 105.064M237.926 105.064L174.003 149.907M260.339 241.828L334.484 105.086M174.003 149.907L110.082 194.753M174.003 149.907L139.847 91.5409"
          className="stroke-icon-disabled"
          strokeWidth="5.92152"
        />
        <path
          d="M205.183 75.1099L142.121 91.0315L80.3555 106.553M142.121 91.0315L112.624 55.9688"
          className="stroke-icon-disabled"
          strokeWidth="6.52175"
        />
        <path d="M296.672 174.203L115.129 212.797" className="stroke-icon-disabled" strokeWidth="11.843" />
        <path
          d="M240.633 58.6875L281.035 83.7134M281.035 83.7134L321.439 108.739M281.035 83.7134L271.875 133.167"
          className="stroke-icon-disabled"
          strokeWidth="5.92152"
        />
        <path d="M184.18 144.398L210.238 192.362" className="stroke-icon-disabled" strokeWidth="11.843" />
        <path d="M29.1367 205.234L119.595 212.252" className="stroke-icon-disabled" strokeWidth="11.843" />
        <path d="M84.3348 105.039L25.832 130.176" className="stroke-icon-disabled" strokeWidth="5.92152" />
        <path d="M25.3867 25.0156L30.3922 253.024V267.856" className="stroke-icon-disabled" strokeWidth="11.843" />
        <path
          d="M9.38672 169.71L96.0907 159.185L55.7777 26.8828L121.297 241.833"
          className="stroke-icon-disabled"
          strokeWidth="11.843"
        />
        <path
          d="M302.861 97.2521L281.02 83.682L271.622 134.408L237.924 105.069L174.001 149.912L155.609 119.152L140.188 92.5169V89.7131L112.151 56.0683L70.0949 74.2926L50.4688 15.4141"
          className="stroke-bg-brand"
          strokeWidth="5.92152"
        />
      </g>
      <path
        d="M28.262 0C43.8695 0.000560748 56.5211 12.6541 56.5211 28.262V239.131H56.4308C55.3206 224.54 43.138 213.045 28.262 213.042C13.3853 213.042 1.20056 224.537 0.09028 239.131H0V28.262C0 12.6538 12.6538 0 28.262 0Z"
        className="fill-icon-secondary"
      />
      <path
        d="M202.321 148.386C200.521 145.866 201.107 142.364 203.628 140.564L215.036 132.419C217.557 130.62 221.059 131.204 222.859 133.725C224.659 136.246 224.073 139.748 221.552 141.548L210.144 149.693C207.623 151.49 204.121 150.907 202.321 148.386Z"
        className="fill-icon-disabled"
      />
      <path
        d="M227.427 130.464C225.627 127.943 226.213 124.441 228.733 122.642L231.016 121.013C233.536 119.213 237.038 119.798 238.838 122.319C240.635 124.839 240.052 128.341 237.532 130.141L235.249 131.77C232.729 133.568 229.227 132.985 227.427 130.464Z"
        className="fill-bg-brand-subtle"
      />
      <path
        d="M226.999 68.6413C226.999 87.9672 205.732 119.031 192.005 119.031C178.278 119.031 157.012 87.9672 157.012 68.6413C157.012 49.3152 172.679 33.6484 192.005 33.6484C211.331 33.6484 226.999 49.3152 226.999 68.6413Z"
        className="fill-bg-brand"
      />
      <path
        d="M191.998 86.8404C202.821 86.8404 211.594 78.067 211.594 67.2444C211.594 56.4218 202.821 47.6484 191.998 47.6484C181.176 47.6484 172.402 56.4218 172.402 67.2444C172.402 78.067 181.176 86.8404 191.998 86.8404Z"
        className="fill-bg-secondary"
      />
    </svg>
  );
}

export function AddressesEmptyState({
  title,
  description,
  ctaLabel,
  onCtaClick,
  className,
}: {
  title: string;
  description?: string;
  /** Omit both on mobile, where a persistent "Add New Address" bar already covers it. */
  ctaLabel?: string;
  onCtaClick?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-10 self-stretch px-6 py-16 lg:px-36",
        className
      )}
    >
      <AddressesEmptyIllustration className="h-64 w-72" />
      <div className="flex flex-col items-center gap-3 self-stretch text-center">
        <p className="text-3xl font-medium text-text-primary">{title}</p>
        {description && <p className="text-xl text-text-secondary">{description}</p>}
      </div>
      {ctaLabel && onCtaClick && (
        <AppButton variant="primary" size="lg" onClick={onCtaClick}>
          {ctaLabel}
        </AppButton>
      )}
    </div>
  );
}
