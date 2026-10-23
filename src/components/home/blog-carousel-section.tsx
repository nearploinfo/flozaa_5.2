"use client";

import { Link } from "@/components/ui/locale-link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import type { BlogPost } from "@/lib/blogs-catalog";
import { BlogCard } from "@/components/home/blog-card";
import { AppButton } from "@/components/ui/app-button";

import "swiper/css";
import "swiper/css/pagination";
import { DoubleChevronRightIcon } from "@/components/icons/icons";

export function BlogCarouselSection({
  title,
  description,
  ctaLabel,
  ctaHref,
  items,
  background,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  items: BlogPost[];
  background?: string;
}) {
  return (
    <section className={`${background ?? ""} commonPY`}>
      <div className="container flex flex-col gap-3 lg:gap-7">
        {/* Mobile header — flat title + plain "View All" link */}
        <div className="flex items-center gap-4 xl:hidden">
          <h2 className="flex-1 text-base font-medium text-text-primary">{title}</h2>
          <AppButton
            asChild
            variant="link"
            size="sm"
            className="h-auto shrink-0 p-0 text-sm text-button-link-primary-text hover:text-button-link-primary-text"
          >
            <Link href={ctaHref}>{ctaLabel}</Link>
          </AppButton>
        </div>

        <div className="hidden items-center justify-between gap-6 xl:flex">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium text-text-primary sm:text-2xl">{title}</h2>
            <p className="text-base text-text-secondary sm:text-lg">{description}</p>
          </div>
          <AppButton
            asChild
            variant="link"
            size="sm"
            className="shrink-0 gap-1 p-0 text-base text-button-link-primary-text hover:text-button-link-primary-text"
          >
            <Link href={ctaHref}>
              <span className="hidden sm:inline">{ctaLabel}</span>
              <DoubleChevronRightIcon className="size-4 rtl:rotate-180" />
            </Link>
          </AppButton>
        </div>

        <div className="flex flex-col items-center gap-7">
          <Swiper
            modules={[Pagination]}
            pagination={{
              clickable: true,
              renderBullet: (_index, className) =>
                `<span class="${className}"><span class="hcs-pagination-dot"></span></span>`,
            }}
            spaceBetween={24}
            slidesPerView={1}
            slidesPerGroup={1}
            breakpoints={{
              768: { slidesPerView: 2, slidesPerGroup: 2 },
              1024: { slidesPerView: 3, slidesPerGroup: 3 },
              1200: { slidesPerView: 4.3, slidesPerGroup: 4 },
            }}
            className="hcs-carousel w-full"
          >
            {items.map((blog) => (
              <SwiperSlide key={blog.id}>
                <BlogCard blog={blog} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
