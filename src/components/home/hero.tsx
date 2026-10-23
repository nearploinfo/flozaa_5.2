"use client";

import { useRef, useState } from "react";
import { Link } from "@/components/ui/locale-link";
import { AppImage } from "@/components/ui/app-image";
import { AppButton } from "@/components/ui/app-button";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper/types";

import "swiper/css";

const AUTOPLAY_MS = 3000;

export interface HeroSlide {
  id: string | number;
  webImage: string;
  appImage: string;
  href: string;
  imageAlt: string;
}

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const swiperRef = useRef<SwiperClass | null>(null);

  return (
    <section
      className="relative w-full overflow-hidden"
      data-marker="MARKER123"
      onMouseEnter={() => {
        swiperRef.current?.autoplay.stop();
        setPaused(true);
      }}
      onMouseLeave={() => {
        swiperRef.current?.autoplay.start();
        setPaused(false);
      }}
    >
      {/*
        Mobile Figma is a compact inset card (h-40, rounded-lg, px-4 page
        margin) — desktop is a full-bleed banner. Same swiper/slide data,
        just a differently-sized/rounded wrapper per breakpoint.
      */}
      <div className="px-4 xl:px-0">
        <div className="relative overflow-hidden rounded-lg xl:rounded-none">
          <Swiper
            modules={[Autoplay]}
            loop={slides.length > 1}
            speed={600}
            autoplay={slides.length > 1 ? { delay: AUTOPLAY_MS, disableOnInteraction: false } : false}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={(swiper) => setActive(swiper.realIndex)}
            className="aspect-343/160 w-full lg:aspect-3/1 xl:aspect-1920/800 xl:h-auto xl:max-h-200"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <Link href={slide.href} className="relative block h-full w-full">
                  <AppImage
                    src={slide.appImage}
                    alt={slide.imageAlt}
                    fill
                    priority
                    className="object-cover xl:hidden"
                  />
                  <AppImage
                    src={slide.webImage}
                    alt={slide.imageAlt}
                    fill
                    priority
                    className="hidden object-cover xl:block"
                  />
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Mobile pagination — floating blurred pill, smaller dots */}
          {slides.length > 1 && (
            <div className="absolute bottom-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1 rounded-lg bg-neutral-800/25 px-2.5 py-[5px] backdrop-blur-[6px] xl:hidden">
              {slides.map((s, index) => (
                <AppButton
                  key={s.id}
                  variant="link"
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => swiperRef.current?.slideToLoop(index)}
                  className={`h-[5px] justify-start p-0 overflow-hidden rounded-[3px] bg-white transition-[width] duration-300 ${
                    index === active ? "w-5" : "w-[5px] rounded-full"
                  }`}
                >
                  {index === active && (
                    <span
                      key={`${s.id}-${active}`}
                      style={{
                        animation: `hero-progress ${AUTOPLAY_MS}ms linear forwards`,
                        animationPlayState: paused ? "paused" : "running",
                      }}
                      className="block h-full w-full rounded-[3px] bg-bg-brand"
                    />
                  )}
                </AppButton>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop pagination — solid pill, larger dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 items-start justify-start gap-1 rounded-3xl bg-bg-primary p-3 xl:inline-flex">
          {slides.map((s, index) => (
            <AppButton
              key={s.id}
              variant="link"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => swiperRef.current?.slideToLoop(index)}
              className={`h-2.5 justify-start p-0 overflow-hidden rounded-2xl bg-bg-tertiary transition-[width] duration-300 ${
                index === active ? "w-6" : "size-2.5"
              }`}
            >
              {index === active && (
                <span
                  key={`${s.id}-${active}`}
                  style={{
                    animation: `hero-progress ${AUTOPLAY_MS}ms linear forwards`,
                    animationPlayState: paused ? "paused" : "running",
                  }}
                  className="block h-full w-full rounded-2xl bg-bg-brand"
                />
              )}
            </AppButton>
          ))}
        </div>
      )}
    </section>
  );
}
