import { cn } from "@/lib/utils";

/** Chat-bubble illustration for the "no conversations" empty state. */
function ChatListEmptyIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 350 351" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M300.818 311.738L310.986 312.567C325.727 313.767 338.651 302.79 339.852 288.049L347.825 190.177C349.025 175.435 338.048 162.511 323.307 161.31L175.864 149.299C161.123 148.099 148.199 159.076 146.998 173.817L139.025 271.689C137.824 286.431 148.801 299.355 163.543 300.556L251.245 307.7L291.822 345.719C294.159 347.909 297.991 346.431 298.251 343.239L300.818 311.738Z"
        className="fill-icon-secondary"
      />
      <path
        d="M68.8171 279.896C68.6611 277.925 66.9374 276.455 64.9672 276.611L54.2643 277.458C33.5772 279.096 15.4789 263.652 13.8408 242.965L2.9659 105.622C1.32788 84.9344 16.7704 66.8364 37.4575 65.1982L244.367 48.815C265.054 47.177 283.152 62.6193 284.79 83.3065L295.665 220.65C297.303 241.337 281.861 259.437 261.174 261.075L139.344 270.722C138.538 270.785 137.777 271.12 137.186 271.672L81.0469 324.034C77.7614 327.099 72.3898 325.012 72.0348 320.534L68.8171 279.896Z"
        className="fill-icon-disabled"
      />
      <path
        d="M275.791 29.9652L287.548 7.80306C288.63 5.7631 290.946 4.87226 292.72 5.81332C294.494 6.75438 295.054 9.17099 293.972 11.211L282.215 33.3731C281.133 35.413 278.817 36.3039 277.043 35.3628C275.27 34.4218 274.709 32.0052 275.791 29.9652Z"
        className="fill-icon-brand"
      />
      <path
        d="M252.611 25.5963L246.736 6.44333C246.06 4.2396 247.298 1.90512 249.502 1.22911C251.706 0.553112 254.04 1.79158 254.716 3.99531L260.591 23.1483C261.267 25.352 260.029 27.6865 257.825 28.3625C255.621 29.0385 253.287 27.8 252.611 25.5963Z"
        className="fill-icon-brand"
      />
      <path
        d="M299.224 50.318L318.377 44.4428C320.581 43.7668 321.819 41.4323 321.143 39.2285C320.467 37.0248 318.133 35.7864 315.929 36.4624L296.776 42.3376C294.572 43.0136 293.334 45.3481 294.01 47.5518C294.686 49.7555 297.02 50.994 299.224 50.318Z"
        className="fill-icon-brand"
      />
      <circle
        cx="156.466"
        cy="195.802"
        r="12.3718"
        transform="rotate(-5.68213 156.466 195.802)"
        className="fill-icon-tertiary stroke-icon-tertiary"
        strokeWidth="2.7493"
      />
      <path
        d="M70.2148 138.773C70.2148 138.773 83.2556 145.367 97.9039 141.615C112.552 137.863 120.818 125.813 120.818 125.813"
        className="stroke-icon-tertiary"
        strokeWidth="5.81744"
        strokeLinecap="round"
      />
      <path
        d="M181.289 122.586C181.289 122.586 191.668 132.872 206.76 133.811C221.852 134.749 233.425 125.827 233.425 125.827"
        className="stroke-icon-tertiary"
        strokeWidth="5.81744"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChatListEmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-6 self-stretch px-6 py-10 text-center",
        className
      )}
    >
      <ChatListEmptyIllustration className="h-40 w-40" />
      <div className="flex flex-col items-center gap-2 self-stretch">
        <p className="text-lg font-medium text-text-primary">{title}</p>
        {description && <p className="text-sm text-text-secondary">{description}</p>}
      </div>
    </div>
  );
}
