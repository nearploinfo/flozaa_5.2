"use client";

import { useTranslation } from "@/lib/i18n/translation-context";
import type {
  FeaturedSection,
  ServiceCardApi,
  ProviderCardApi,
  CategoryApi,
  OfferApi,
  Offer,
  BlogApi,
  ReviewApi,
  Testimonial,
  OngoingOrderApi,
  OngoingBooking,
  OngoingBookingStatus,
  PreviousBooking,
} from "@/lib/home-screen";
import type { CategoryTreeNode } from "@/lib/categories-tree-api";
import type { ServiceCardData } from "@/lib/services-catalog";
import type { NearbyProvider } from "@/lib/providers-catalog";
import type { BlogPost } from "@/lib/blogs-catalog";
import { formatFullDate } from "@/lib/helpers";
import { normalizeDurationType } from "@/lib/services-catalog";
import { formatBookingTime } from "@/lib/orders-catalog";
import { buildChatHref } from "@/lib/chats/chat-types";
import { CategoryGrid } from "@/components/home/category-grid";
import { ServiceCarouselSection } from "@/components/home/service-carousel-section";
import { ProviderCarouselSection } from "@/components/home/provider-carousel-section";
import { OffersSection } from "@/components/home/offers-section";
import { BlogCarouselSection } from "@/components/home/blog-carousel-section";
import { WhyChooseUsSection } from "@/components/home/why-choose-us-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { CtaSection } from "@/components/home/cta-section";
import { FaqSection } from "@/components/home/faq-section";
import { OngoingBookingsSection } from "@/components/home/ongoing-bookings-section";
import { PreviousBookingsSection } from "@/components/home/previous-bookings-section";
import { CantFindServiceCard } from "@/components/home/cant-find-service-card";

function toCategoryTreeNode(category: CategoryApi): CategoryTreeNode {
  return {
    id: String(category.id),
    slug: category.slug,
    name: category.name,
    image: category.category_image ?? category.image ?? "",
    providerCount: category.total_providers,
    serviceCount: category.total_services,
  };
}

function toServiceCardData(service: ServiceCardApi): ServiceCardData {
  const price = Number.parseFloat(service.price) || 0;
  const discountedPrice = Number.parseFloat(service.discounted_price) || 0;

  return {
    id: service.slug,
    serviceId: Number.parseInt(service.id, 10) || undefined,
    title: service.title,
    image: service.image,
    category: service.category_name,
    rating: Number.parseFloat(service.average_rating) || 0,
    persons: Number.parseInt(service.number_of_members_required, 10) || 0,
    minutes: Number.parseInt(service.duration, 10) || 0,
    durationType: normalizeDurationType(service.duration_type),
    price: discountedPrice > 0 ? discountedPrice : price,
    originalPrice: price,
    discountPercent: service.discount_percentage,
    isBookmarked: service.is_bookmarked === 1,
    providerName: service.company_name,
    providerVerified: service.is_provider_verified === 1,
  };
}

function toNearbyProvider(provider: ProviderCardApi): NearbyProvider {
  return {
    id: provider.slug,
    providerId: provider.id,
    name: provider.company_name,
    avatar: provider.profile_image,
    banner: provider.banner,
    serviceCount: provider.total_services,
    distanceKm: Number.parseFloat(provider.distance) || 0,
    rating: Number.parseFloat(provider.average_rating) || 0,
    startingPrice: Number.parseFloat(provider.starting_price) || 0,
    verified: provider.is_verified === 1,
    isBookmarked: provider.is_bookmarked === 1,
    href: `/provider-details/${provider.slug}`,
    // The API sends `{}` (not null/omitted) when there's no upcoming slot.
    nextAvailable: provider.next_available_slot?.date ? provider.next_available_slot : undefined,
  };
}

function toOffer(offer: OfferApi, index: number): Offer {
  return {
    id: `offer-${index}`,
    image: offer.image,
    alt: "",
    href: offer.link || "/services",
  };
}

function toTestimonial(review: ReviewApi): Testimonial {
  return {
    id: `${review.user_id}-${review.service_name}`,
    rating: Number.parseFloat(review.rating) || 0,
    quote: review.comment,
    avatar: review.user_image,
    name: review.user_name,
    service: review.service_name,
  };
}

const ONGOING_ORDER_STATUS: Record<string, OngoingBookingStatus> = {
  arrived: "arrived",
  started: "started",
  on_the_way: "onTheWay",
  onTheWay: "onTheWay",
};

function toOngoingBookingDate(startDate: string): string {
  if (!startDate) return "";
  const [year, month, day] = startDate.split("-");
  return year && month && day ? `${day}/${month}/${year}` : startDate;
}

function toOngoingBooking(order: OngoingOrderApi, lang: string, defaultLocale: string): OngoingBooking {
  return {
    id: String(order.id),
    date: toOngoingBookingDate(order.start_date),
    time: order.start_time ? formatBookingTime(order.start_time, order.start_date) : "",
    status: ONGOING_ORDER_STATUS[order.status] ?? "started",
    title: order.service_name ?? "",
    extraCount: order.other_services_count,
    providerName: order.provider.company_name,
    providerAvatar: order.provider.profile_image,
    providerHref: `/booking/${order.id}`,
    chatHref:
      order.provider.post_booking_allowed === 1
        ? buildChatHref(
            {
              partnerId: order.provider.provider_id,
              bookingId: order.id,
              name: order.provider.company_name,
              image: order.provider.profile_image,
            },
            lang,
            defaultLocale
          )
        : undefined,
  };
}

function toPreviousBooking(order: OngoingOrderApi): PreviousBooking {
  return {
    id: String(order.id),
    orderId: order.id,
    isReorderAllowed: order.is_reorder_allowed === "1",
    date: toOngoingBookingDate(order.start_date),
    time: order.start_time ? formatBookingTime(order.start_time, order.start_date) : "",
    rating: order.rating ? Number.parseFloat(order.rating) || null : null,
    title: order.service_name ?? "",
    extraCount: order.other_services_count,
    providerName: order.provider.company_name,
    providerAvatar: order.provider.profile_image,
    providerHref: `/booking/${order.id}`,
  };
}

function toBlogPost(blog: BlogApi): BlogPost {
  return {
    id: blog.slug,
    image: blog.image,
    category: blog.category,
    date: formatFullDate(blog.created_at),
    title: blog.title,
    excerpt: blog.short_description,
    href: `/blog-details/${blog.slug}`,
  };
}

export function SectionRenderer({ sections }: { sections: FeaturedSection[] }) {
  const { t, lang, defaultLocale } = useTranslation();

  const renderedSections = sections.map((section) => {
        switch (section.section_type) {
          case "all_categories":
          case "categories":
            if (section.categories.length === 0) return null;
            return (
              <CategoryGrid
                key={section.id}
                title={section.title}
                description={section.description}
                categories={section.categories.map(toCategoryTreeNode)}
              />
            );
          case "category_wise_service":
          case "recommended_service":
          case "top_rated_service":
          case "popular_service":
            if (section.services.length === 0) return null;
            return (
              <ServiceCarouselSection
                key={section.id}
                title={section.title}
                description={section.description}
                ctaLabel={t("common.browseAll")}
                ctaHref="/services"
                items={section.services.map(toServiceCardData)}
              />
            );
          case "top_rated_partner":
          case "near_by_provider":
          case "partners":
            if (section.providers.length === 0) return null;
            return (
              <ProviderCarouselSection
                key={section.id}
                title={section.title}
                description={section.description}
                ctaLabel={t("common.browseAll")}
                ctaHref="/providers"
                items={section.providers.map(toNearbyProvider)}
                cardStyle={section.layout_type === "style_1" ? "style-1" : "style-2"}
                highlight={
                  section.section_type === "near_by_provider"
                    ? "distance"
                    : section.section_type === "top_rated_partner"
                      ? "rating"
                      : undefined
                }
              />
            );
          case "offers":
            if (section.offers.length === 0) return null;
            return <OffersSection key={section.id} items={section.offers.map(toOffer)} />;
          case "blogs":
            if (section.blogs.length === 0) return null;
            return (
              <BlogCarouselSection
                key={section.id}
                title={section.title}
                description={section.description}
                ctaLabel={t("common.browseAll")}
                ctaHref="/blogs"
                items={section.blogs.map(toBlogPost)}
              />
            );
          case "why_choose_us":
            if (section.stats.length === 0 && section.points.length === 0) return null;
            return (
              <WhyChooseUsSection
                key={section.id}
                title={section.title}
                description={section.description}
                sectionImage={section.section_image}
                points={section.points}
                stats={section.stats}
              />
            );
          case "how_it_works":
            if (section.steps.length === 0) return null;
            return (
              <HowItWorksSection
                key={section.id}
                title={section.title}
                description={section.description}
                steps={section.steps}
              />
            );
          case "reviews":
            if (section.reviews.length === 0) return null;
            return (
              <TestimonialsSection
                key={section.id}
                title={section.title}
                description={section.description}
                sectionImage={section.section_image}
                averageRating={Number.parseFloat(section.average_rating) || 0}
                totalReviews={section.total_reviews}
                reviews={section.reviews.map(toTestimonial)}
              />
            );
          case "primary_search_banner":
            if (!section.image) return null;
            return (
              <CtaSection
                key={section.id}
                title={section.title}
                description={section.description}
                image={section.image}
                ctaLink={section.cta_link}
              />
            );
          case "ongoing_order":
            if (section.orders.length === 0) return null;
            return (
              <OngoingBookingsSection
                key={section.id}
                title={section.title}
                description={section.description}
                items={section.orders.map((order) => toOngoingBooking(order, lang, defaultLocale))}
              />
            );
          case "previous_order":
            if (section.orders.length === 0) return null;
            return (
              <PreviousBookingsSection
                key={section.id}
                title={section.title}
                description={section.description}
                items={section.orders.map(toPreviousBooking)}
              />
            );
          case "faqs":
            if (section.faqs.length === 0) return null;
            return (
              <FaqSection
                key={section.id}
                title={section.title}
                description={section.description}
                faqs={section.faqs}
              />
            );
          default:
            return null;
        }
      }).filter((node) => node !== null);

  // Section order comes straight from the backend — no fixed slot to anchor
  // this in, so it's just dropped in partway through the list instead.
  const ctaIndex = Math.min(6, renderedSections.length);

  return (
    <>
      {renderedSections.slice(0, ctaIndex)}
      <CantFindServiceCard key="cant-find-service" />
      {renderedSections.slice(ctaIndex)}
    </>
  );
}
