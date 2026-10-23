import type { SVGProps } from "react";

export function BottomNavHomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.0402 6.82165L14.2802 2.79165C12.7102 1.69165 10.3002 1.75165 8.79023 2.92165L3.78023 6.83165C2.78023 7.61165 1.99023 9.21165 1.99023 10.4716V17.3716C1.99023 19.9216 4.06023 22.0016 6.61023 22.0016H17.3902C19.9402 22.0016 22.0102 19.9316 22.0102 17.3816V10.6016C22.0102 9.25165 21.1402 7.59165 20.0402 6.82165ZM12.7502 18.0016C12.7502 18.4116 12.4102 18.7516 12.0002 18.7516C11.5902 18.7516 11.2502 18.4116 11.2502 18.0016V15.0016C11.2502 14.5916 11.5902 14.2516 12.0002 14.2516C12.4102 14.2516 12.7502 14.5916 12.7502 15.0016V18.0016Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Outline counterpart to BottomNavHomeIcon — used when the Home tab is
 * inactive, matching every other bottom-nav icon's outline-only style.
 * BottomNavHomeIcon (filled) is reserved for the active state. */
export function BottomNavHomeOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M9.02 2.84016L3.63 7.04016C2.73 7.74016 2 9.23016 2 10.3602V17.7702C2 20.0902 3.89 21.9902 6.21 21.9902H17.79C20.11 21.9902 22 20.0902 22 17.7802V10.5002C22 9.29016 21.19 7.74016 20.2 7.05016L14.02 2.72016C12.62 1.74016 10.37 1.79016 9.02 2.84016Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 17.9902V14.9902"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BottomNavBookingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M7.99983 22H15.9998C20.0198 22 20.7398 20.39 20.9498 18.43L21.6998 10.43C21.9698 7.99 21.2698 6 16.9998 6H6.99983C2.72983 6 2.02983 7.99 2.29983 10.43L3.04983 18.43C3.25983 20.39 3.97983 22 7.99983 22Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 6V5.2C8 3.43 8 2 11.2 2H12.8C16 2 16 3.43 16 5.2V6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 13V14C14 14.01 14 14.01 14 14.02C14 15.11 13.99 16 12 16C10.02 16 10 15.12 10 14.03V13C10 12 10 12 11 12H13C14 12 14 12 14 13Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.65 11C19.34 12.68 16.7 13.68 14 14.02"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.62012 11.2695C4.87012 12.8095 7.41012 13.7395 10.0001 14.0295"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BottomNavChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15.9965 11H16.0054" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.9955 11H12.0045" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.99451 11H8.00349" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BottomNavRequestIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M21.8095 3.94183C20.2695 7.78183 16.4095 13.0018 13.1795 15.5918L11.2095 17.1718C10.9595 17.3518 10.7095 17.5118 10.4295 17.6218C10.4295 17.4418 10.4195 17.2418 10.3895 17.0518C10.2795 16.2118 9.89953 15.4318 9.22953 14.7618C8.54953 14.0818 7.71953 13.6818 6.86953 13.5718C6.66953 13.5618 6.46953 13.5418 6.26953 13.5618C6.37953 13.2518 6.54953 12.9618 6.75953 12.7218L8.31953 10.7518C10.8995 7.52183 16.1395 3.64183 19.9695 2.11183C20.5595 1.89183 21.1295 2.05183 21.4895 2.42183C21.8695 2.79183 22.0495 3.36183 21.8095 3.94183Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.4303 17.6188C10.4303 18.7188 10.0103 19.7688 9.22027 20.5688C8.61027 21.1788 7.78027 21.5988 6.79027 21.7288L4.33027 21.9988C2.99027 22.1488 1.84027 21.0088 2.00027 19.6488L2.27027 17.1888C2.51027 14.9988 4.34027 13.5988 6.28027 13.5588C6.48027 13.5488 6.69027 13.5588 6.88027 13.5688C7.73027 13.6788 8.56027 14.0688 9.24027 14.7588C9.91027 15.4288 10.2903 16.2088 10.4003 17.0488C10.4103 17.2388 10.4303 17.4288 10.4303 17.6188Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.2398 14.4683C14.2398 11.8583 12.1198 9.73828 9.50977 9.73828"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.1197 12.7305L20.8597 13.4605C22.3497 14.9505 22.3497 16.4205 20.8597 17.9105L17.8997 20.8705C16.4297 22.3405 14.9397 22.3405 13.4697 20.8705"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M3.11031 10.5086C1.64031 9.01859 1.64031 7.54859 3.11031 6.05859L6.07031 3.09859C7.54031 1.62859 9.03031 1.62859 10.5003 3.09859L11.2403 3.83859"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M11.2498 3.85156L7.5498 7.55156" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20.1202 12.7305L17.1602 15.6805" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function BottomNavProfileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.5901 22C20.5901 18.13 16.7402 15 12.0002 15C7.26015 15 3.41016 18.13 3.41016 22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
