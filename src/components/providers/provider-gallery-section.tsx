"use client";

import { useState } from "react";
import { AppImage } from "@/components/ui/app-image";
import { EmptyState } from "@/components/ui/empty-state";
import { GalleryLightbox } from "@/components/ui/gallery-lightbox";
import { ProviderGalleryIcon } from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";

export function ProviderGallerySection({ images, title }: { images: string[]; title: string }) {
  const { t } = useTranslation();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const openLightbox = (index: number) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      {/* max-lg: edge-to-edge masonry columns, no card chrome. */}
      <section className="self-stretch xl:hidden">
        {images.length === 0 ? (
          <EmptyState
            icon={ProviderGalleryIcon}
            title={t("providerDetails.gallery.emptyTitle")}
            description={t("providerDetails.gallery.emptyDescription")}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => openLightbox(index)}
                className="block w-full"
              >
                <AppImage
                  src={image}
                  alt={t("providerDetails.gallery.photoAlt", { index: index + 1 })}
                  className="aspect-square w-full rounded-lg object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="hidden self-stretch rounded-xl border border-border-default bg-bg-primary p-6 xl:block">
        {images.length === 0 ? (
          <EmptyState
            icon={ProviderGalleryIcon}
            title={t("providerDetails.gallery.emptyTitle")}
            description={t("providerDetails.gallery.emptyDescription")}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {images.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => openLightbox(index)}
                className="block"
              >
                <AppImage
                  src={image}
                  alt={t("providerDetails.gallery.photoAlt", { index: index + 1 })}
                  className="h-32 w-full rounded-lg object-cover"
                />
              </button>
            ))}
          </div>
        )}

      </div>

      <GalleryLightbox
        images={images}
        title={title}
        open={lightboxOpen}
        activeIndex={activeImageIndex}
        onOpenChange={setLightboxOpen}
        onActiveIndexChange={setActiveImageIndex}
      />
    </>
  );
}
