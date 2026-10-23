import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";

export interface BecomeProviderSectionBase {
  status: number;
  title?: string;
  translated_title?: string;
  description?: string;
  translated_description?: string;
  short_headline?: string;
  translated_short_headline?: string;
}

export interface HeroImageApi {
  image: string;
}

export interface HeroSectionApi extends BecomeProviderSectionBase {
  images: HeroImageApi[];
}

export interface CategoryApi {
  id: string | number;
  name: string;
  translated_name?: string;
  description?: string;
  translated_description?: string;
  category: string;
}

export interface CategorySectionApi extends BecomeProviderSectionBase {
  categories: CategoryApi[];
}

export interface HowItWorkStepApi {
  title: string;
  translated_title?: string;
  description: string;
  translated_description?: string;
}

export interface HowItWorkSectionApi extends BecomeProviderSectionBase {
  steps: HowItWorkStepApi[];
  translated_steps?: HowItWorkStepApi[];
}

export interface FeatureApi {
  position: "left" | "right";
  short_headline?: string;
  translated_short_headline?: string;
  title: string;
  translated_title?: string;
  description: string;
  translated_description?: string;
  image: string;
}

export interface FeatureSectionApi extends BecomeProviderSectionBase {
  features: FeatureApi[];
}

export interface SubscriptionApi {
  id: string | number;
  name: string;
  translated_name?: string;
  description?: string;
  translated_description?: string;
  price: number | string;
  discount_price?: number | string;
  duration: number | string;
  order_type: "limited" | "unlimited";
  max_order_limit?: number | string;
  service_type: "limited" | "unlimited";
  is_commision?: "yes" | "no";
  commission_percentage?: number | string;
  commission_threshold?: number | string;
  tax_type?: "included" | "excluded";
}

export interface SubscriptionSectionApi extends BecomeProviderSectionBase {
  subscriptions: SubscriptionApi[];
}

export interface TopProviderApi {
  id: string | number;
  company_name: string;
  translated_company_name?: string;
  image: string;
  location?: string;
  average_rating: number | string;
  // Filtering field ("has any rating yet") — distinct from `average_rating`, which is
  // what's actually displayed. The API/old app use two separate rating fields.
  total_rating?: number | string;
  completed_orders?: number;
  services?: { title: string; translated_title?: string }[];
}

export interface TopProvidersSectionApi extends BecomeProviderSectionBase {
  providers: TopProviderApi[];
}

export interface ReviewApi {
  username: string;
  profile_image: string;
  comment: string;
  rating: number | string;
}

export interface ReviewSectionApi extends BecomeProviderSectionBase {
  reviews: ReviewApi[];
}

export interface FaqApi {
  id: string | number;
  question: string;
  translated_question?: string;
  answer: string;
  translated_answer?: string;
}

export interface FaqSectionApi extends BecomeProviderSectionBase {
  faqs: FaqApi[];
  translated_faqs?: FaqApi[];
}

export interface BecomeProviderData {
  hero_section?: HeroSectionApi;
  category_section?: CategorySectionApi;
  how_it_work_section?: HowItWorkSectionApi;
  feature_section?: FeatureSectionApi;
  subscription_section?: SubscriptionSectionApi;
  top_providers_section?: TopProvidersSectionApi;
  review_section?: ReviewSectionApi;
  faq_section?: FaqSectionApi;
  // Live API returns these two camelCase (unlike every other snake_case field here).
  rating?: number | string;
  happyCustomers?: number;
}

// postApiSafe returns the full response envelope, not just its `data` field.
export interface BecomeProviderResponse {
  error: boolean;
  message: string;
  data: BecomeProviderData;
}

export function translated<T extends { title?: string; translated_title?: string }>(item: T): string {
  return item.translated_title || item.title || "";
}

export function translatedDescription<T extends { description?: string; translated_description?: string }>(
  item: T
): string {
  return item.translated_description || item.description || "";
}

export function translatedHeadline<
  T extends { short_headline?: string; translated_short_headline?: string },
>(item: T): string {
  return item.translated_short_headline || item.short_headline || "";
}

interface WebSettings {
  partner_register_url?: string;
}

interface AppSettings {
  provider_appstore_url?: string;
  provider_playstore_url?: string;
}

// Settings load client-side only (AppBootstrap fetch / redux-persist rehydration),
// so SSR never has them — gate on hasHydrated so the first client render matches
// the server markup exactly, same pattern as use-cart-settings.ts and friends.
export function usePartnerRegisterUrl(): string | undefined {
  const hasHydrated = useHasHydrated();
  const raw = useAppSelector((state) => state.settings.data) as { web_settings?: WebSettings } | null;
  return hasHydrated ? raw?.web_settings?.partner_register_url : undefined;
}

export function useProviderAppLinks(): { appStoreUrl?: string; playStoreUrl?: string } {
  const hasHydrated = useHasHydrated();
  const raw = useAppSelector((state) => state.settings.data) as { app_settings?: AppSettings } | null;
  if (!hasHydrated) return {};
  return {
    appStoreUrl: raw?.app_settings?.provider_appstore_url,
    playStoreUrl: raw?.app_settings?.provider_playstore_url,
  };
}
