"use client";

import { Link } from "@/components/ui/locale-link";
import { ArrowUpRight, Home, Wrench } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";

function GridPattern() {
  return (
    <svg
      viewBox="0 0 1117 412"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 size-full opacity-30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#cta-grid-pattern-clip)">
        <path
          opacity="0.45"
          d="M40.3413 -304.996V1231.18M82.1388 -304.996V1231.18M123.936 -304.996V1231.18M165.734 -304.996V1231.18M207.531 -304.996V1231.18M249.329 -304.996V1231.18M291.126 -304.996V1231.18M332.924 -304.996V1231.18M374.721 -304.996V1231.18M416.519 -304.996V1231.18M458.316 -304.996V1231.18M500.114 -304.996V1231.18M541.911 -304.996V1231.18M583.709 -304.996V1231.18M625.506 -304.996V1231.18M667.304 -304.996V1231.18M709.101 -304.996V1231.18M750.899 -304.996V1231.18M792.696 -304.996V1231.18M834.494 -304.996V1231.18M876.291 -304.996V1231.18M918.089 -304.996V1231.18M959.886 -304.996V1231.18M1001.68 -304.996V1231.18M1043.48 -304.996V1231.18M1085.28 -304.996V1231.18M1127.08 -304.996V1231.18M1168.87 -304.996V1231.18M1210.67 -304.996V1231.18M1252.47 -304.996V1231.18M1294.27 -304.996V1231.18M1336.06 -304.996V1231.18M1377.86 -304.996V1231.18M1419.66 -304.996V1231.18M1461.46 -304.996V1231.18M1503.25 -304.996V1231.18M1545.05 -304.996V1231.18M1586.85 -304.996V1231.18M1628.65 -304.996V1231.18M1670.44 -304.996V1231.18M1712.24 -304.996V1231.18M1754.04 -304.996V1231.18M1795.84 -304.996V1231.18M1837.63 -304.996V1231.18M1879.43 -304.996V1231.18M1921.23 -304.996V1231.18M1963.03 -304.996V1231.18M2004.82 -304.996V1231.18M2046.62 -304.996V1231.18M2088.42 -304.996V1231.18M2130.22 -304.996V1231.18M2172.01 -304.996V1231.18M2213.81 -304.996V1231.18M2255.61 -304.996V1231.18M2297.41 -304.996V1231.18M2339.2 -304.996V1231.18M2381 -304.996V1231.18M2422.8 -304.996V1231.18M2464.6 -304.996V1231.18M2506.39 -304.996V1231.18M2548.19 -304.996V1231.18M0 -286.505H2588.75M0 -242.411H2588.75M0 -198.317H2588.75M0 -154.223H2588.75M0 -110.129H2588.75M0 -66.0348H2588.75M0 -21.9407H2588.75M0 22.1534H2588.75M0 66.2474H2588.75M0 110.341H2588.75M0 154.436H2588.75M0 198.53H2588.75M0 242.624H2588.75M0 286.718H2588.75M0 330.812H2588.75M0 374.906H2588.75M0 419H2588.75M0 463.094H2588.75M0 507.188H2588.75M0 551.282H2588.75M0 595.376H2588.75M0 639.47H2588.75M0 683.564H2588.75M0 727.658H2588.75M0 771.752H2588.75M0 815.846H2588.75M0 859.94H2588.75M0 904.034H2588.75M0 948.129H2588.75M0 992.223H2588.75M0 1036.32H2588.75M0 1080.41H2588.75M0 1124.5H2588.75M0 1168.6H2588.75M0 1212.69H2588.75"
          stroke="#F7F7F7"
          strokeMiterlimit="10"
        />
      </g>
      <defs>
        <clipPath id="cta-grid-pattern-clip">
          <rect width="1638" height="972" fill="white" transform="translate(-260 -305)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function DiagonalPanelShape() {
  return (
    <svg
      viewBox="0 0 937 412"
      className="pointer-events-none absolute inset-y-0 left-0 hidden h-full xl:block"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M-0.5 7.68749C-0.5 -5.56735 10.2452 -16.3125 23.5 -16.3125H678.067C686.682 -16.3125 694.637 -11.6944 698.909 -4.21248L933.003 405.788C942.138 421.787 930.584 441.688 912.16 441.688H23.5C10.2451 441.688 -0.5 430.942 -0.5 417.688V7.68749Z"
        className="fill-bg-brand"
      />
    </svg>
  );
}

function LocationBadge({
  icon: Icon,
  label,
  className,
}: {
  icon: typeof Home;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`absolute inline-flex items-center gap-1.5 rounded-full bg-bg-primary px-2.5 py-1.5 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.06)] ${className ?? ""}`}
    >
      <Icon className="size-4 text-icon-primary" />
      <span className="text-sm text-text-primary">{label}</span>
    </div>
  );
}

export function CtaSection({
  title,
  description,
  image,
  ctaLink,
}: {
  title: string;
  description: string;
  image: string;
  ctaLink: string;
}) {
  const { t } = useTranslation();

  return (
    <section className="container hidden commonPY xl:block">
      <div className="relative overflow-hidden rounded-3xl bg-bg-inverse xl:flex xl:h-103">
        <div className="hidden xl:block">
          <GridPattern />
        </div>

        <DiagonalPanelShape />

        <div className="relative z-10 flex w-full flex-col gap-8 rounded-3xl bg-bg-brand px-8 py-16 xl:justify-center xl:rounded-none xl:bg-transparent xl:px-16 xl:py-0">
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-3xl leading-tight font-medium text-text-inverse-light lg:text-5xl lg:leading-15">
              {title}
            </h2>
            <p className="text-lg text-text-inverse-light">{description}</p>
          </div>
          <AppButton asChild variant="secondary" size="lg" className="w-fit">
            <Link href={ctaLink || "/services"}>
              {t("home.cta.button")}
              <ArrowUpRight className="size-7" />
            </Link>
          </AppButton>
        </div>

        <div className="relative hidden h-full w-full items-end justify-end xl:flex">
          <AppImage src={image} alt={title} className="h-full w-auto object-contain" />
        </div>
      </div>
    </section>
  );
}
