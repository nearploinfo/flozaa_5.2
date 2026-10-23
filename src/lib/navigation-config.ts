export type NavItem = {
  labelKey: string;
  href: string;
  children?: NavItem[];
};

export const mainNavItems: NavItem[] = [
  { labelKey: "nav.home", href: "/" },
  { labelKey: "nav.services", href: "/services" },
  { labelKey: "nav.providers", href: "/providers" },
  {
    labelKey: "nav.about",
    href: "/about-us",
    children: [
      { labelKey: "nav.aboutUs", href: "/about-us" },
      { labelKey: "nav.becomeProvider", href: "/become-provider" },
    ],
  },
  {
    labelKey: "nav.pages",
    href: "/blogs",
    children: [
      { labelKey: "nav.blogs", href: "/blogs" },
      { labelKey: "nav.faqs", href: "/faqs" },
      { labelKey: "nav.contactUs", href: "/contact-us" },
      { labelKey: "nav.privacyPolicy", href: "/privacy-policy" },
      { labelKey: "nav.termsAndConditions", href: "/terms-and-conditions" },
    ],
  },
];

export const bottomNavItems: NavItem[] = [
  { labelKey: "nav.home", href: "/" },
  { labelKey: "nav.bookings", href: "/general-bookings" },
  { labelKey: "nav.chats", href: "/chats" },
  { labelKey: "nav.request", href: "/my-services-requests" },
  { labelKey: "nav.profile", href: "/account" },
];

// Pages that show the bottom nav bar without being one of its own tab
// destinations — e.g. Requested Bookings, reached from within the Bookings
// tab rather than being a tab itself.
const EXTRA_BOTTOM_NAV_PATHS = new Set(["/requested-bookings"]);

const BOTTOM_NAV_PATHS = new Set([...bottomNavItems.map((item) => item.href), ...EXTRA_BOTTOM_NAV_PATHS]);

/** True on every page the mobile bottom nav renders on. */
export function isBottomNavPath(pathname: string): boolean {
  return BOTTOM_NAV_PATHS.has(pathname);
}

export const footerNavItems: NavItem[] = [
  { labelKey: "nav.aboutUs", href: "/about-us" },
  { labelKey: "nav.contactUs", href: "/contact-us" },
  { labelKey: "nav.faqs", href: "/faqs" },
  { labelKey: "nav.privacyPolicy", href: "/privacy-policy" },
  { labelKey: "nav.termsAndConditions", href: "/terms-and-conditions" },
  { labelKey: "nav.sitemap", href: "/sitemap" },
];

export const accountNavItems: NavItem[] = [
  { labelKey: "nav.profile", href: "/account" },
  { labelKey: "nav.addresses", href: "/addresses" },
  { labelKey: "nav.bookmarks", href: "/bookmarks" },
  { labelKey: "nav.notifications", href: "/notifications" },
  { labelKey: "nav.paymentHistory", href: "/payment-history" },
  { labelKey: "nav.generalBookings", href: "/general-bookings" },
  { labelKey: "nav.requestedBookings", href: "/requested-bookings" },
  { labelKey: "nav.myServiceRequests", href: "/my-services-requests" },
];
