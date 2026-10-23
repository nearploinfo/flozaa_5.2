import { normalizeDurationType } from "@/lib/services-catalog";

export interface CartFee {
  id: number;
  title: string;
  valueType: string;
  value: number;
  isRefundable: boolean;
  /** A percentage fee is calculated on the services' price BEFORE tax. */
  amount: number;
  /** Only a taxable fee has its tax added on top of `amount`. */
  isTaxable: boolean;
  taxAmount: number;
}

export interface CartTaxComponent {
  /** Display name of the tax rule, in the request language (e.g. "CGST"). */
  name: string;
  percentage: number;
  taxAmount: number;
}

/** One charged element of the cart: the services collapsed together, the
 * visiting charge, or a single taxable fee. Mirrors `tax.breakdown` in
 * get_booking_details, so the same renderer serves cart and booking. */
export interface CartTaxBreakdownEntry {
  /** Raw response key — "services", "visiting_charges" or "fee_<id>". */
  key: string;
  title: string;
  baseAmount: number;
  totalTax: number;
  totalWithTax: number;
  /** "included" | "excluded" | "mixed" (services priced both ways). */
  taxType: string;
  taxComponents: CartTaxComponent[];
}

export interface CartPromo {
  promoCodeId: number;
  /** Taken off the services' price BEFORE tax. */
  discount: number;
}

/** Which country/region the cart was priced for, and what decided it. */
export interface CartPricingLocation {
  countryId: number | null;
  regionId: number | null;
  source: "address" | "coordinates" | "none" | string;
}

export interface CartItem {
  id?: number;
  serviceId: number;
  serviceTitle?: string;
  image?: string;
  price: number;
  discountedPrice?: number;
  qty: number;
  numberOfMembersRequired?: number;
  averageRating?: number;
  duration?: number;
  durationType?: string;
  maxQuantityAllowed?: number;
  /** Per unit, from the country/region tax rules — not a flat service rate. */
  taxAmount?: number;
  taxPercentage?: number;
}

export interface CartGroup {
  cartId: number;
  providerId: number;
  providerImage?: string;
  providerSlug?: string;
  providerAddress?: string;
  companyName: string;
  isProviderVerified: boolean;
  providerLatitude?: number;
  providerLongitude?: number;
  distance?: number | null;
  totalQuantity: number;
  /** Already tax-inclusive: subTotal = subTotalWithoutTax + taxValue. */
  subTotal: number;
  /** The services' tax only — NOT the cart's total tax (that's `taxTotal`). */
  taxValue?: number;
  /** What `finalTotal` would be without the promo — i.e. the price before it. */
  overallAmount?: number;
  subTotalWithoutTax?: number;
  /** The amount place_order actually charges for this cart. Authoritative —
   * never recompute it client-side (v5.2.0 prices visiting-charge tax, fee tax
   * and the promo's tax reduction server-side). */
  finalTotal?: number;
  /** All tax on the cart AFTER the promo. The breakdown entries are before it. */
  taxTotal?: number;
  /** Tax removed by the promo — the saving on top of `promo.discount`. */
  promoTaxReduction?: number;
  taxBreakdown?: CartTaxBreakdownEntry[];
  /** Set when the previewed promo applies to THIS cart; null otherwise. */
  promo?: CartPromo | null;
  /** Why a previewed promo couldn't be used — the cart is priced without it. */
  promoError?: string | null;
  pricingLocation?: CartPricingLocation;
  visitingCharges?: number;
  atStore?: boolean;
  atDoorstep?: boolean;
  isPayLaterAllowed?: boolean;
  isOnlinePaymentAllowed?: boolean;
  /** How many days out this provider can be booked — the date picker disables
   * anything beyond today + this many days. */
  advanceBookingDays?: number;
  fees?: CartFee[];
  feesTotal?: number;
  items: CartItem[];
}

export interface CartData {
  carts: CartGroup[];
  totalServiceCount: number;
  totalProviderCount: number;
  totalOverallAmount: number;
}

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function toBool(value: unknown): boolean {
  return value === 1 || value === "1" || value === true;
}

function normalizeFee(raw: Record<string, unknown>): CartFee {
  return {
    id: toNumber(raw.id),
    title: String(raw.title ?? ""),
    valueType: String(raw.value_type ?? "fixed"),
    value: toNumber(raw.value),
    isRefundable: toBool(raw.is_refundable),
    amount: toNumber(raw.amount),
    isTaxable: toBool(raw.is_taxable),
    taxAmount: toNumber(raw.tax_amount),
  };
}

function normalizeTaxComponent(raw: Record<string, unknown>): CartTaxComponent {
  return {
    name: String(raw.name ?? ""),
    percentage: toNumber(raw.percentage),
    taxAmount: toNumber(raw.tax_amount),
  };
}

/** `tax_breakdown` arrives as an object keyed by element ("services",
 * "visiting_charges", "fee_1") — flattened to an array so the order is stable
 * and each entry keeps its key for the fee→breakdown join. */
function normalizeTaxBreakdown(raw: unknown): CartTaxBreakdownEntry[] | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  return Object.entries(raw as Record<string, unknown>)
    .filter(([, entry]) => entry && typeof entry === "object")
    .map(([key, entry]) => {
      const value = entry as Record<string, unknown>;
      return {
        key,
        title: String(value.title ?? ""),
        baseAmount: toNumber(value.base_amount),
        totalTax: toNumber(value.total_tax),
        totalWithTax: toNumber(value.total_with_tax),
        taxType: String(value.tax_type ?? ""),
        taxComponents: Array.isArray(value.tax_components)
          ? value.tax_components.map((component) =>
              normalizeTaxComponent(component as Record<string, unknown>)
            )
          : [],
      };
    });
}

function normalizePromo(raw: unknown): CartPromo | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  return { promoCodeId: toNumber(value.promo_code_id), discount: toNumber(value.discount) };
}

function normalizePricingLocation(raw: unknown): CartPricingLocation | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  return {
    countryId: value.country_id == null ? null : toNumber(value.country_id),
    regionId: value.region_id == null ? null : toNumber(value.region_id),
    source: String(value.source ?? "none"),
  };
}

/** One charged element of the bill, as the app shows it: the element's own
 * total INCLUDING its tax, with the pre-tax price and each tax rule nested
 * under it. */
export interface BillLine {
  key: string;
  title: string;
  /** What this element adds to the total — price plus its own tax. */
  total: number;
  /** Price before tax. Undefined when there's nothing to break down. */
  baseAmount?: number;
  taxComponents?: CartTaxComponent[];
}

/**
 * Turns a priced cart into the per-element bill the app shows: Services,
 * Visiting Charges and one line per fee, each carrying its own tax, instead of
 * a flat subtotal with pooled "Taxes"/"Fees" rows.
 *
 * `tax_breakdown` is the source wherever it exists, because it's the only
 * thing that knows an element's pre-tax price and which rules applied. Two
 * cases fall back:
 *   - a cart priced before v5.2.0 has no breakdown at all, so services/
 *     visiting charges come from the flat fields with no tax rows;
 *   - a NON-taxable fee has no breakdown object by design, so it shows as a
 *     bare amount with nothing nested.
 *
 * The lines are pre-promo (so is the breakdown), which is why the promo is a
 * separate deduction rather than something folded into Services.
 */
export function toBillLines(group: CartGroup): BillLine[] {
  const breakdown = new Map((group.taxBreakdown ?? []).map((entry) => [entry.key, entry]));
  const lines: BillLine[] = [];

  const services = breakdown.get("services");
  if (services) {
    lines.push({
      key: "services",
      title: services.title,
      total: services.totalWithTax,
      baseAmount: services.baseAmount,
      taxComponents: services.taxComponents,
    });
  } else {
    lines.push({ key: "services", title: "", total: group.subTotal });
  }

  const visiting = breakdown.get("visiting_charges");
  if (visiting) {
    lines.push({
      key: "visiting_charges",
      title: visiting.title,
      total: visiting.totalWithTax,
      baseAmount: visiting.baseAmount,
      taxComponents: visiting.taxComponents,
    });
  } else if (group.visitingCharges) {
    lines.push({ key: "visiting_charges", title: "", total: group.visitingCharges });
  }

  for (const fee of group.fees ?? []) {
    const entry = breakdown.get(`fee_${fee.id}`);
    lines.push(
      entry
        ? {
            key: `fee_${fee.id}`,
            title: entry.title || fee.title,
            total: entry.totalWithTax,
            baseAmount: entry.baseAmount,
            taxComponents: entry.taxComponents,
          }
        : { key: `fee_${fee.id}`, title: fee.title, total: fee.amount }
    );
  }

  return lines.filter((line) => line.total !== 0);
}

/** The amount to charge: the server's `final_total` when the cart was priced
 * the v5.2.0 way, else the pre-v5.2.0 pre-promo total. Never derived from
 * sub_total (which already contains the services' tax). */
export function cartPayableAmount(group: CartGroup): number {
  return group.finalTotal ?? group.overallAmount ?? group.subTotal;
}

/** The price before the promo, for the struck-through "was" figure. */
export function cartPrePromoAmount(group: CartGroup): number {
  return group.overallAmount ?? group.subTotal;
}

/** What the customer actually saves on the payable amount: the discount on the
 * pre-tax price PLUS the tax that discount removed. Use this one figure
 * everywhere a "you saved" number is shown. */
export function cartPromoSaving(group: CartGroup): number {
  if (group.finalTotal === undefined) return group.promo?.discount ?? 0;
  return Math.max(0, cartPrePromoAmount(group) - group.finalTotal);
}

function normalizeItem(raw: Record<string, unknown>): CartItem {
  return {
    serviceId: toNumber(raw.service_id),
    price: toNumber(raw.price),
    qty: toNumber(raw.qty),
    ...(raw.id !== undefined ? { id: toNumber(raw.id) } : {}),
    ...(raw.service_title ? { serviceTitle: String(raw.service_title) } : {}),
    ...(raw.image_of_the_service ? { image: String(raw.image_of_the_service) } : {}),
    ...(raw.discounted_price !== undefined ? { discountedPrice: toNumber(raw.discounted_price) } : {}),
    ...(raw.number_of_members_required !== undefined
      ? { numberOfMembersRequired: toNumber(raw.number_of_members_required) }
      : {}),
    ...(raw.average_rating !== undefined ? { averageRating: toNumber(raw.average_rating) } : {}),
    ...(raw.duration !== undefined ? { duration: toNumber(raw.duration) } : {}),
    ...(raw.duration_type ? { durationType: normalizeDurationType(String(raw.duration_type)) } : {}),
    ...(raw.max_quantity_allowed !== undefined
      ? { maxQuantityAllowed: toNumber(raw.max_quantity_allowed) }
      : {}),
    ...(raw.tax_amount !== undefined ? { taxAmount: toNumber(raw.tax_amount) } : {}),
    ...(raw.tax_percentage !== undefined ? { taxPercentage: toNumber(raw.tax_percentage) } : {}),
  };
}

function normalizeGroup(raw: Record<string, unknown>): CartGroup {
  const fees = Array.isArray(raw.fees)
    ? raw.fees.map((fee) => normalizeFee(fee as Record<string, unknown>))
    : undefined;
  const taxBreakdown = normalizeTaxBreakdown(raw.tax_breakdown);
  const pricingLocation = normalizePricingLocation(raw.pricing_location);

  return {
    cartId: toNumber(raw.cart_id),
    providerId: toNumber(raw.provider_id),
    companyName: String(raw.company_name ?? ""),
    isProviderVerified: toBool(raw.is_provider_verified),
    totalQuantity: toNumber(raw.total_quantity),
    subTotal: toNumber(raw.sub_total),
    items: Array.isArray(raw.items) ? raw.items.map((item) => normalizeItem(item as Record<string, unknown>)) : [],
    ...(raw.provider_image ? { providerImage: String(raw.provider_image) } : {}),
    ...(raw.provider_slug ? { providerSlug: String(raw.provider_slug) } : {}),
    ...(raw.provider_address ? { providerAddress: String(raw.provider_address) } : {}),
    ...(raw.provider_latitude !== undefined ? { providerLatitude: toNumber(raw.provider_latitude) } : {}),
    ...(raw.provider_longitude !== undefined ? { providerLongitude: toNumber(raw.provider_longitude) } : {}),
    // A non-numeric/empty distance (e.g. "") means the backend never computed
    // it — fall back to null rather than toNumber's 0 default so the
    // checkout page's local haversine calc can still fill it in, instead of
    // permanently locking the banner to a false "0.0 km".
    ...(raw.distance !== undefined
      ? { distance: raw.distance === null || !Number.isFinite(Number(raw.distance)) ? null : Number(raw.distance) }
      : {}),
    ...(raw.tax_value !== undefined ? { taxValue: toNumber(raw.tax_value) } : {}),
    ...(raw.overall_amount !== undefined ? { overallAmount: toNumber(raw.overall_amount) } : {}),
    ...(raw.sub_total_without_tax !== undefined
      ? { subTotalWithoutTax: toNumber(raw.sub_total_without_tax) }
      : {}),
    ...(raw.final_total !== undefined ? { finalTotal: toNumber(raw.final_total) } : {}),
    ...(raw.tax_total !== undefined ? { taxTotal: toNumber(raw.tax_total) } : {}),
    ...(raw.promo_tax_reduction !== undefined
      ? { promoTaxReduction: toNumber(raw.promo_tax_reduction) }
      : {}),
    ...(taxBreakdown ? { taxBreakdown } : {}),
    // promo/promo_error are explicitly null when there's nothing to show, and
    // that null has to survive onto the group — mergeCartData spreads a
    // re-priced group over the previous one, so omitting the key would leave a
    // stale discount line (or error) from the last pricing pass on screen.
    ...(raw.promo !== undefined ? { promo: normalizePromo(raw.promo) } : {}),
    ...(raw.promo_error !== undefined
      ? { promoError: raw.promo_error == null ? null : String(raw.promo_error) }
      : {}),
    ...(pricingLocation ? { pricingLocation } : {}),
    ...(raw.visiting_charges !== undefined ? { visitingCharges: toNumber(raw.visiting_charges) } : {}),
    ...(raw.at_store !== undefined ? { atStore: toBool(raw.at_store) } : {}),
    ...(raw.at_doorstep !== undefined ? { atDoorstep: toBool(raw.at_doorstep) } : {}),
    ...(raw.is_pay_later_allowed !== undefined ? { isPayLaterAllowed: toBool(raw.is_pay_later_allowed) } : {}),
    ...(raw.is_online_payment_allowed !== undefined
      ? { isOnlinePaymentAllowed: toBool(raw.is_online_payment_allowed) }
      : {}),
    ...(raw.advance_booking_days !== undefined
      ? { advanceBookingDays: toNumber(raw.advance_booking_days) }
      : {}),
    ...(fees ? { fees, feesTotal: raw.fees_total !== undefined ? toNumber(raw.fees_total) : fees.reduce((sum, fee) => sum + fee.amount, 0) } : {}),
  };
}

/**
 * manage_cart_new responses carry `carts` directly under `data`; get_cart_new
 * and remove_from_cart_new wrap it under `data.cart_data` instead (both also
 * ship a `reorder_data` sibling). Accept either shape so every cart mutation
 * can feed the same redux slice.
 */
export function normalizeCartResponse(raw: unknown): CartData | null {
  if (!raw) return null;

  // remove_from_cart ships its patch as a bare array of cart groups, with no
  // `carts` wrapper key and no total_service_count/total_provider_count/
  // total_overall_amount summary — treat the array itself as `carts` and
  // derive the summary the same way mergeCartData recomputes it.
  if (Array.isArray(raw)) {
    const carts = raw.map((group) => normalizeGroup(group as Record<string, unknown>));
    return {
      carts,
      totalServiceCount: carts.reduce((sum, group) => sum + group.totalQuantity, 0),
      totalProviderCount: carts.length,
      totalOverallAmount: carts.reduce((sum, group) => sum + cartPayableAmount(group), 0),
    };
  }

  if (typeof raw !== "object") return null;
  const container = raw as Record<string, unknown>;
  const source =
    "cart_data" in container
      ? (container.cart_data as Record<string, unknown> | null)
      : container;

  if (!source || !Array.isArray(source.carts)) return null;

  return {
    carts: source.carts.map((group) => normalizeGroup(group as Record<string, unknown>)),
    totalServiceCount: toNumber(source.total_service_count),
    totalProviderCount: toNumber(source.total_provider_count),
    totalOverallAmount: toNumber(source.total_overall_amount),
  };
}

/**
 * manage_cart/remove_from_cart responses only carry the fields relevant to
 * that mutation: often just the one provider's group that was touched (not
 * every provider in the cart), and usually without the top-level
 * total_service_count/total_provider_count/total_overall_amount summary at
 * all — see 1.8 vs 1.9 in the API notes. Blindly spreading `...patch` over
 * the previous state used to (a) drop every OTHER provider's cart group
 * that the patch didn't mention, and (b) reset the summary totals to 0,
 * which is exactly what made things like CartMiniBar's `totalServiceCount
 * > 0` check go false right after adding a service from a card — the cart
 * genuinely had items, the merged total just didn't. Fixed by carrying
 * over untouched groups and recomputing the summary from the merged carts
 * instead of trusting whatever the partial response happened to report.
 */
export function mergeCartData(previous: CartData | null, patch: CartData | null): CartData | null {
  if (!patch) return null;

  const previousGroups = new Map(previous?.carts.map((group) => [group.cartId, group]) ?? []);
  const patchGroupIds = new Set(patch.carts.map((group) => group.cartId));

  const mergedPatchGroups = patch.carts.map((group) => {
    const previousGroup = previousGroups.get(group.cartId);
    const previousItems = new Map(previousGroup?.items.map((item) => [item.serviceId, item]) ?? []);
    return {
      ...previousGroup,
      ...group,
      items: group.items.map((item) => ({
        ...previousItems.get(item.serviceId),
        ...item,
      })),
    };
  });

  const untouchedPreviousGroups = (previous?.carts ?? []).filter(
    (group) => !patchGroupIds.has(group.cartId)
  );

  const carts = [...mergedPatchGroups, ...untouchedPreviousGroups].filter(
    (group) => group.totalQuantity > 0
  );

  return {
    carts,
    totalServiceCount: carts.reduce((sum, group) => sum + group.totalQuantity, 0),
    totalProviderCount: carts.length,
    totalOverallAmount: carts.reduce((sum, group) => sum + cartPayableAmount(group), 0),
  };
}

/**
 * reorder_data's item list ships under `data`, each entry shaped like an
 * order line (id/order_id/service_id/qty/price/discounted_price) with the
 * display fields (title/image/duration/max qty) nested one level deeper in
 * `servic_details` instead of flat like a real cart item — flatten that out
 * so normalizeItem's field mapping can apply unchanged.
 */
function flattenReorderItem(raw: Record<string, unknown>): Record<string, unknown> {
  const details = (raw.servic_details ?? {}) as Record<string, unknown>;
  return {
    id: raw.id,
    service_id: raw.service_id,
    qty: raw.qty,
    price: raw.price ?? details.price,
    discounted_price: raw.discounted_price ?? details.discounted_price,
    service_title: details.translated_title ?? details.title,
    image_of_the_service: details.image_of_the_service,
    duration: details.duration,
    duration_type: details.duration_type,
    number_of_members_required: details.number_of_members_required,
    max_quantity_allowed: details.max_quantity_allowed,
  };
}

/**
 * get_cart's `reorder_data` (requested via `order_id`) is shaped like a
 * single cart group, minus a real `cart_id` — reuse the same field mapping
 * as a normal cart group, keyed by the order id instead so checkout-draft
 * caching and the switch-provider count still have something stable to key
 * off of.
 */
export function normalizeReorderGroup(raw: Record<string, unknown>, orderId: number): CartGroup {
  const rawItems = Array.isArray(raw.items) ? raw.items : Array.isArray(raw.data) ? raw.data : [];
  const items = rawItems.map((item) => flattenReorderItem(item as Record<string, unknown>));
  return { ...normalizeGroup({ ...raw, items }), cartId: orderId };
}

/**
 * custom_job_data's single item ships the bid amount as `counter_price`
 * instead of `price` (everything else — duration/tax_amount/tax_percentage —
 * is already shaped like a normal cart item) — map that one field so
 * normalizeItem's mapping applies unchanged.
 */
function flattenCustomJobItem(raw: Record<string, unknown>): Record<string, unknown> {
  return { ...raw, price: raw.price ?? raw.counter_price };
}

/**
 * get_cart's `custom_job_data` (requested via custom_job_request_id +
 * bidder_id) is wrapped the same way as `cart_data` — `{ carts: [...], ... }`
 * — with exactly one entry in `carts`. Reuse the same field mapping as a
 * normal cart group, keyed by the custom job request id (same convention as
 * normalizeReorderGroup keying by the order id) since the single carried
 * cart_id is this request's id, not a real cart row.
 */
export function normalizeCustomJobGroup(raw: unknown, customJobRequestId: number): CartGroup | null {
  if (!raw || typeof raw !== "object") return null;
  const carts = (raw as Record<string, unknown>).carts;
  const groupRaw = Array.isArray(carts) ? (carts[0] as Record<string, unknown> | undefined) : undefined;
  if (!groupRaw) return null;
  const items = Array.isArray(groupRaw.items)
    ? groupRaw.items.map((item) => flattenCustomJobItem(item as Record<string, unknown>))
    : [];
  return { ...normalizeGroup({ ...groupRaw, items }), cartId: customJobRequestId };
}

export function findCartItem(data: CartData | null, serviceId: number): CartItem | undefined {
  for (const group of data?.carts ?? []) {
    const item = group.items.find((entry) => entry.serviceId === serviceId);
    if (item) return item;
  }
  return undefined;
}
