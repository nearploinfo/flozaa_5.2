import { cn } from "@/lib/utils";

/** Torn-page/magnifier illustration for "no data" empty states — distinct
 * from a routing 404, this is for "the request succeeded, there's just
 * nothing to show" (e.g. a booking id the API reports as not found). */
function NoDataFoundIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 328" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M227.425 17.2344H13.7833C6.171 17.2344 0 23.4054 0 31.0177V313.576C0 321.188 6.171 327.359 13.7833 327.359H227.425C235.037 327.359 241.208 321.188 241.208 313.576V31.0177C241.208 23.4054 235.037 17.2344 227.425 17.2344Z"
        className="fill-icon-disabled"
      />
      <path d="M227.423 31.0156H13.7812V313.574H227.423V31.0156Z" className="fill-icon-disabled" />
      <path
        d="M13.7812 31.0156H227.423V244.657H155.06V313.574H13.7812V31.0156Z"
        className="fill-icon-tertiary"
      />
      <path
        d="M44.793 184.564C44.793 180.759 47.8784 177.672 51.6846 177.672H189.538C193.346 177.672 196.43 180.759 196.43 184.564C196.43 188.371 193.346 191.455 189.538 191.455H51.6846C47.8784 191.455 44.793 188.371 44.793 184.564Z"
        className="fill-icon-disabled"
      />
      <path
        d="M44.793 215.579C44.793 211.775 47.8784 208.688 51.6846 208.688H140.625C144.429 208.688 147.517 211.775 147.517 215.579C147.517 219.387 144.429 222.471 140.625 222.471H51.6846C47.8784 222.471 44.793 219.387 44.793 215.579Z"
        className="fill-icon-disabled"
      />
      <path
        d="M157.297 215.579C157.297 211.775 160.384 208.688 164.189 208.688H174.864C178.671 208.688 181.755 211.775 181.755 215.579C181.755 219.387 178.671 222.471 174.864 222.471H164.189C160.384 222.471 157.297 219.387 157.297 215.579Z"
        className="fill-icon-tertiary"
      />
      <path
        d="M294.239 59.9582L281.641 47.3594L177.7 151.3L190.299 163.899L294.239 59.9582Z"
        className="fill-bg-brand"
      />
      <path
        d="M284.79 44.1951C288.27 40.7162 293.911 40.7162 297.392 44.1951C300.868 47.6744 300.868 53.3148 297.392 56.7941L294.242 59.9439L281.641 47.345L284.79 44.1951Z"
        className="fill-bg-primary"
      />
      <path
        d="M177.699 151.289L190.301 163.89L176.169 169.944C173.309 171.167 170.418 168.28 171.645 165.42L177.699 151.289Z"
        className="fill-bg-brand"
      />
      <path d="M155.062 244.648H227.425L155.062 313.565V244.648Z" className="fill-icon-secondary" />
      <path
        d="M168.845 10.3438H72.3614C64.7491 10.3438 58.5781 16.5148 58.5781 24.1271C58.5781 31.7394 64.7491 37.9104 72.3614 37.9104H168.845C176.457 37.9104 182.628 31.7394 182.628 24.1271C182.628 16.5148 176.457 10.3438 168.845 10.3438Z"
        className="fill-icon-secondary"
      />
      <path
        d="M79.25 13.7833C79.25 6.17114 85.4211 0 93.0333 0H148.167C155.778 0 161.95 6.17114 161.95 13.7833V20.675H79.25V13.7833Z"
        className="fill-icon-secondary"
      />
      <path
        d="M168.842 111.995C168.842 86.3037 148.015 65.4766 122.323 65.4766C96.6318 65.4766 75.8047 86.3037 75.8047 111.995C75.8047 137.687 96.6318 158.514 122.323 158.514C148.015 158.514 168.842 137.687 168.842 111.995Z"
        className="fill-icon-inverse"
      />
      <path
        d="M141.321 130.994C140.9 131.414 140.332 131.649 139.739 131.649C139.146 131.649 138.574 131.414 138.154 130.994L122.324 115.163L106.494 130.994C106.074 131.414 105.504 131.649 104.911 131.649C104.317 131.649 103.747 131.414 103.328 130.994C102.908 130.574 102.672 130.004 102.672 129.411C102.672 128.817 102.908 128.247 103.328 127.828L119.158 111.997L103.328 96.1659C102.908 95.7458 102.672 95.1766 102.672 94.5829C102.672 93.9888 102.908 93.4195 103.328 92.9995C103.747 92.5798 104.317 92.3438 104.911 92.3438C105.504 92.3438 106.074 92.5798 106.494 92.9995L122.324 108.83L138.154 92.9995C138.574 92.5798 139.146 92.3438 139.739 92.3438C140.332 92.3438 140.9 92.5798 141.321 92.9995C141.741 93.4195 141.979 93.9888 141.979 94.5829C141.979 95.1766 141.741 95.7458 141.321 96.1659L125.491 111.997L141.321 127.828C141.741 128.247 141.979 128.817 141.979 129.411C141.979 130.004 141.741 130.574 141.321 130.994Z"
        className="fill-icon-tertiary stroke-icon-tertiary"
        strokeWidth="4.47765"
      />
    </svg>
  );
}

export function NoDataFoundState({
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
        "flex min-h-[70vh] w-full flex-col items-center justify-center gap-6 px-6 py-10 sm:min-h-[60vh] sm:gap-10 sm:py-16 lg:px-36",
        className
      )}
    >
      <NoDataFoundIllustration className="h-44 w-40 sm:h-80 sm:w-72" />
      <div className="flex flex-col items-center gap-2 text-center sm:gap-3">
        <p className="text-xl font-medium text-text-primary sm:text-3xl">{title}</p>
        {description && <p className="text-sm text-text-secondary sm:text-xl">{description}</p>}
      </div>
    </div>
  );
}
