"use client";

import type { Testimonial } from "@/lib/home-screen";
import { StarIcon } from "@/components/icons/icons";
import { AppImage } from "@/components/ui/app-image";
import { AppTag } from "@/components/ui/app-tag";
import { TestimonialsMarqueeColumn } from "@/components/home/testimonials-marquee-column";
import { TestimonialsMarqueeRow } from "@/components/home/testimonials-marquee-row";
import { useTranslation } from "@/lib/i18n/translation-context";
import smilingMen from "@/assets/home/smiling_men.png";

function CollageBackgroundShape() {
  return (
    <svg
      viewBox="0 0 656 288"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[65%] w-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M656 264C656 277.255 645.255 288 632 288H88.8535V222C88.8535 208.745 78.1084 198 64.8535 198H0V24C0 10.7452 10.7452 0 24 0H656V264Z"
        className="fill-bg-brand"
      />
      <path
        d="M656 264C656 277.255 645.255 288 632 288H88.8535V222C88.8535 208.745 78.1084 198 64.8535 198H0V24C0 10.7452 10.7452 0 24 0H656V264Z"
        fill="url(#testimonial-shape-pattern)"
        fillOpacity="0.14"
      />
      <defs>
        <pattern
          id="testimonial-shape-pattern"
          patternContentUnits="objectBoundingBox"
          width="0.0676829"
          height="0.154167"
        >
          <use
            href="#testimonial-shape-pattern-image"
            transform="scale(0.000564024 0.00128472)"
          />
        </pattern>
        <image
          id="testimonial-shape-pattern-image"
          width="120"
          height="120"
          preserveAspectRatio="none"
          href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAYAAAA5ZDbSAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAAMdJREFUeAHt3aEOgzAUQFGY7f9/avVmlxoECYO7cxyyuSFNn2j37cCc8/39PcbYt7Dael8baQLHCRwncJzAcQLHCRy3r+e+s+5+bvy39fqD4wSOEzjucP8wizaL5sYEjhM4TuA4geMEjhMYAAAAAAAAAAAAAAAAAAAAAAAAuJz7ohfui+ZRBI4TOE7gOIHjBI4TOM7bhSd5u5CfEjhO4Diz6IVZNI8icJzAcQLHCRwncJzAAAAAAAAAAAAAAAAAAAAAAAAAwOU+oB4wSwluFHMAAAAASUVORK5CYII="
        />
      </defs>
    </svg>
  );
}

function IntroText({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-xl font-medium text-text-primary sm:text-2xl">{title}</h2>
      <p className="text-base text-text-secondary sm:text-lg">{description}</p>
    </div>
  );
}

function CollageAndRating({
  sectionImage,
  averageRating,
  totalReviews,
  reviewerAvatars,
}: {
  sectionImage: string;
  averageRating: number;
  totalReviews: number;
  reviewerAvatars: string[];
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="relative h-70 w-full lg:h-96">
        <CollageBackgroundShape />

        <div className="absolute -bottom-1 -left-1 z-10 flex size-14 lg:size-16 items-center justify-center rounded-2xl bg-bg-inverse">
          <StarIcon className="size-8 lg:size-11 text-icon-inverse" />
        </div>

        <AppImage
          src={sectionImage || smilingMen}
          alt="Happy customer"
          className="absolute bottom-0 left-14 z-10 h-56 w-auto object-contain object-bottom lg:h-80"
        />

        <div className="absolute top-16 right-0 z-10 flex items-center gap-2.5 rounded-xl rounded-br-none! bg-bg-inverse px-3.5 py-2.5 lg:top-22">
          <span className="text-center text-xs lg:text-xl font-medium text-nowrap text-text-inverse-dark">
            {t("home.testimonials.heading")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center">
          {reviewerAvatars.map((avatar, index) => (
            <AppImage
              key={avatar + index}
              src={avatar}
              alt="Customer"
              className={`size-12 rounded-full border-4 border-border-white object-cover ${index > 0 ? "-ml-3" : ""}`}
            />
          ))}
          {totalReviews > reviewerAvatars.length && (
            <div className="relative -ml-3 flex size-12 items-center justify-center rounded-full border-4 border-border-white bg-bg-inverse">
              <span className="font-['Montserrat'] text-base font-semibold text-text-inverse-light">
                +{totalReviews - reviewerAvatars.length}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-1">
          <span className="text-sm text-text-primary">
            {t("home.testimonials.basedOnReviews", { count: totalReviews })}
          </span>
          <AppTag
            variant="default"
            shape="pill"
            className="gap-2 border-border-default bg-surface-primary px-3 py-2"
          >
            <span className="text-sm font-medium text-text-primary">{averageRating.toFixed(1)}</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => {
                const fillPercent = Math.round(
                  Math.min(1, Math.max(0, averageRating - index)) * 100
                );
                return (
                  <span key={index} className="relative inline-block size-4">
                    <StarIcon className="absolute inset-0 size-4 text-border-strong" />
                    <span
                      className="absolute inset-y-0 left-0 overflow-hidden"
                      style={{ width: `${fillPercent}%` }}
                    >
                      <StarIcon className="size-4 text-icon-primary" />
                    </span>
                  </span>
                );
              })}
            </div>
          </AppTag>
        </div>
      </div>
    </>
  );
}

export function TestimonialsSection({
  title,
  description,
  sectionImage,
  averageRating,
  totalReviews,
  reviews,
}: {
  title: string;
  description: string;
  sectionImage: string;
  averageRating: number;
  totalReviews: number;
  reviews: Testimonial[];
}) {
  const columnOne = reviews.filter((_, index) => index % 2 === 0);
  const columnTwo = reviews.filter((_, index) => index % 2 === 1);
  const reviewerAvatars = reviews.slice(0, 3).map((review) => review.avatar);

  return (
    <section className="hidden bg-bg-brand-subtle xl:block">
      <div className="container flex flex-col gap-8 overflow-hidden py-16 xl:hidden">
        <IntroText title={title} description={description} />
        <TestimonialsMarqueeRow testimonials={columnOne} direction="left" />
        <CollageAndRating
          sectionImage={sectionImage}
          averageRating={averageRating}
          totalReviews={totalReviews}
          reviewerAvatars={reviewerAvatars}
        />
        <TestimonialsMarqueeRow testimonials={columnTwo} direction="right" />
      </div>

      <div className="container hidden grid-cols-8 items-center gap-8 commonPY xl:grid">
        <div className="col-span-3 flex flex-col gap-8">
          <IntroText title={title} description={description} />
          <CollageAndRating
            sectionImage={sectionImage}
            averageRating={averageRating}
            totalReviews={totalReviews}
            reviewerAvatars={reviewerAvatars}
          />
        </div>

        <div className="col-span-5 grid grid-cols-2 gap-6">
          <TestimonialsMarqueeColumn testimonials={columnOne} direction="up" />
          <TestimonialsMarqueeColumn testimonials={columnTwo} direction="down" />
        </div>
      </div>
    </section>
  );
}
