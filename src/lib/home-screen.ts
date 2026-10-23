import type { BookingStatusKey } from "@/lib/helpers";

export interface SliderItem {
  id: string;
  type: string;
  type_id: string;
  slider_app_image: string;
  slider_web_image: string;
  category_parent_id: number;
  category_name: string;
  provider_name: string;
  url: string;
}

interface FeaturedSectionBase {
  id: string;
  title: string;
  description: string;
}

export interface ServiceCardApi {
  id: string;
  slug: string;
  title: string;
  description: string;
  category_name: string;
  image: string;
  number_of_members_required: string;
  duration: string;
  duration_type: string;
  price: string;
  discounted_price: string;
  average_rating: string;
  discount_percentage: number;
  is_bookmarked?: number;
  provider_id: number;
  company_name: string;
  is_provider_verified: number;
}

export interface NextAvailableSlot {
  date: string;
  starting_time: string;
  ending_time: string;
}

export interface ProviderCardApi {
  id: number;
  slug: string;
  profile_image: string;
  banner: string;
  company_name: string;
  average_rating: string;
  total_services: number;
  distance: string;
  starting_price: string;
  is_verified: number;
  is_bookmarked?: number;
  next_available_slot: NextAvailableSlot;
}

export interface CategoryApi {
  id: string;
  slug: string;
  name: string;
  // The `all_categories` section returns `category_image`; the `categories`
  // (subcategories) section returns `image`. Both are real field names, not
  // versions of the same field — only one is ever present on a given item.
  image?: string;
  category_image?: string;
  total_providers: number;
  total_services?: number;
}

export interface OfferApi {
  image: string;
  link: string;
}

export interface Offer {
  id: string;
  image: string;
  alt: string;
  href: string;
}

export interface HowItWorksStepApi {
  step_key: string;
  title: string;
  description: string;
  icon: string;
}

export interface WhyChooseUsStatApi {
  metric_key: string;
  title: string;
  icon: string;
  value: number | string;
}

export interface Stat {
  id: string;
  target: number;
  suffix: string;
  decimals: number;
  label: string;
}

export interface ReviewApi {
  user_id: string;
  user_name: string;
  comment: string;
  rating: string;
  user_image: string;
  service_name: string;
}

export interface Testimonial {
  id: string;
  rating: number;
  quote: string;
  avatar: string;
  name: string;
  service: string;
}

export interface FaqApi {
  id: string;
  question: string;
  answer: string;
}

export type OngoingBookingStatus = Extract<BookingStatusKey, "arrived" | "onTheWay" | "started">;

export interface OngoingBooking {
  id: string;
  date: string;
  time: string;
  status: OngoingBookingStatus;
  title: string;
  extraCount: number;
  providerName: string;
  providerAvatar: string;
  providerHref: string;
  chatHref?: string;
}

export interface PreviousBooking {
  id: string;
  orderId: number;
  isReorderAllowed: boolean;
  date: string;
  time: string;
  rating: number | null;
  title: string;
  extraCount: number;
  providerName: string;
  providerAvatar: string;
  providerHref: string;
}

export interface OngoingOrderApi {
  id: number;
  status: string;
  start_date: string;
  start_time: string;
  service_name: string;
  other_services_count: number;
  final_total: number;
  is_reorder_allowed: string;
  rating: string;
  provider: {
    provider_id: number;
    company_name: string;
    profile_image: string;
    is_provider_verified: number;
    // Only meaningful on ongoing_order entries — previous_order (completed) never chats.
    post_booking_allowed: number;
  };
}

export interface BlogApi {
  id: number;
  slug: string;
  title: string;
  category: string;
  image: string;
  short_description: string;
  created_at: string;
}

export type FeaturedSection =
  | (FeaturedSectionBase & {
      section_type: "all_categories" | "categories";
      categories: CategoryApi[];
    })
  | (FeaturedSectionBase & {
      section_type:
        | "category_wise_service"
        | "recommended_service"
        | "top_rated_service"
        | "popular_service";
      services: ServiceCardApi[];
    })
  | (FeaturedSectionBase & {
      section_type: "top_rated_partner" | "near_by_provider" | "partners";
      layout_type?: string;
      providers: ProviderCardApi[];
    })
  | (FeaturedSectionBase & {
      section_type: "offers";
      layout_type: string;
      offers: OfferApi[];
    })
  | (FeaturedSectionBase & {
      section_type: "blogs";
      blogs: BlogApi[];
    })
  | (FeaturedSectionBase & {
      section_type: "how_it_works";
      steps: HowItWorksStepApi[];
    })
  | (FeaturedSectionBase & {
      section_type: "why_choose_us";
      section_image: string;
      points: string[];
      stats: WhyChooseUsStatApi[];
    })
  | (FeaturedSectionBase & {
      section_type: "reviews";
      section_image: string;
      total_reviews: number;
      average_rating: string;
      reviews: ReviewApi[];
    })
  | (FeaturedSectionBase & {
      section_type: "primary_search_banner";
      image: string;
      cta_link: string;
    })
  | (FeaturedSectionBase & {
      section_type: "faqs";
      faqs: FaqApi[];
    })
  | (FeaturedSectionBase & {
      section_type: "ongoing_order";
      orders: OngoingOrderApi[];
    })
  | (FeaturedSectionBase & {
      section_type: "previous_order";
      orders: OngoingOrderApi[];
    });

export interface HomeScreenData {
  sliders: SliderItem[];
  featured_sections: FeaturedSection[];
}

// postApiSafe returns the full response envelope, not just its `data` field.
export interface HomeScreenResponse {
  error: boolean;
  message: string;
  code: number;
  data: HomeScreenData;
}
