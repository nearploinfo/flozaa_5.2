import { cn } from "@/lib/utils";

/** Folder-with-bookmark illustration for the "no bookmarks" empty state. */
function BookmarksEmptyIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 288" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M0 35.9152C0 28.9723 5.62854 23.3438 12.5714 23.3438H207.429C214.371 23.3438 220 28.9723 220 35.9152V274.772C220 281.715 214.371 287.344 207.429 287.344H12.5714C5.62854 287.344 0 281.715 0 274.772V35.9152Z"
        className="fill-icon-secondary"
      />
      <path
        d="M0 34.3359C0 28.0401 4.65678 22.7155 10.8963 21.8766L172.753 0.114231C180.293 -0.899655 187 4.96491 187 12.5735V251.205C187 257.5 182.342 262.824 176.104 263.663L14.2466 285.428C6.7059 286.44 0 280.575 0 272.966V34.3359Z"
        className="fill-icon-disabled"
      />
      <path
        d="M44.8783 256.479C44.3953 253.044 46.7905 249.863 50.2281 249.382L65.7897 247.195C69.2273 246.711 72.4057 249.106 72.8891 252.544C73.3721 255.982 70.977 259.16 67.5393 259.644L51.9778 261.831C48.5401 262.312 45.3617 259.917 44.8783 256.479Z"
        className="fill-icon-secondary"
      />
      <path
        d="M79.1127 251.668C78.6297 248.233 81.0248 245.053 84.4625 244.572L87.5749 244.132C91.0125 243.651 94.1909 246.046 94.6743 249.484C95.1573 252.919 92.7621 256.1 89.3245 256.581L86.2121 257.021C82.7745 257.501 79.5961 255.107 79.1127 251.668Z"
        className="fill-icon-inverse"
      />
      <path
        d="M100.898 248.606C100.415 245.171 102.81 241.99 106.248 241.506L109.36 241.069C112.798 240.588 115.976 242.983 116.46 246.418C116.944 249.857 114.549 253.037 111.111 253.518L107.997 253.958C104.56 254.439 101.381 252.044 100.898 248.606Z"
        className="fill-icon-inverse"
      />
      <path
        d="M31.4297 20.7188V281.057"
        className="stroke-border-default"
        strokeWidth="3.14286"
        strokeLinecap="round"
      />
      <path
        d="M122.586 6.86382L163.431 1.35156V66.5153L143.002 49.2295L122.586 72.0275V6.86382Z"
        className="fill-icon-brand"
      />
    </svg>
  );
}

export function BookmarksEmptyState({
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
        "flex w-full flex-col items-center justify-center gap-10 self-stretch px-6 py-16 lg:px-36",
        className
      )}
    >
      <BookmarksEmptyIllustration className="h-72 w-56" />
      <div className="flex flex-col items-center gap-3 self-stretch text-center">
        <p className="text-3xl font-medium text-text-primary">{title}</p>
        {description && <p className="text-xl text-text-secondary">{description}</p>}
      </div>
    </div>
  );
}
