"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { ZoomIn, RotateCcw, RotateCw } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AuthHeader } from "@/components/auth/shared/auth-header";
import { Slider } from "@/components/ui/slider";
import { AppButton } from "@/components/ui/app-button";
import { getCroppedImageFile } from "@/lib/crop-image";
import { useTranslation } from "@/lib/i18n/translation-context";

export function AvatarCropDialog({
  imageSrc,
  onCancel,
  onCropped,
}: {
  imageSrc: string;
  onCancel: () => void;
  onCropped: (file: File, previewUrl: string) => void;
}) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedArea) return;
    setSaving(true);
    try {
      const file = await getCroppedImageFile(imageSrc, croppedArea, rotation);
      onCropped(file, URL.createObjectURL(file));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="w-[502px] max-w-full gap-0 overflow-hidden rounded-xl p-0 sm:max-w-none"
      >
        <AuthHeader
          title={t("account.profile.cropTitle")}
          description={t("account.profile.cropDescription")}
          onClose={onCancel}
        />

        <div className="relative h-80 w-full bg-bg-secondary">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="flex flex-col items-stretch gap-6 p-6">
          <div className="flex items-center gap-3">
            <ZoomIn className="size-5 shrink-0 text-icon-primary" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.01}
              onValueChange={(value) => setZoom(value[0] ?? 1)}
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            <AppButton
              type="button"
              variant="secondary-outline"
              size="sm"
              onClick={() => setRotation((value) => (value - 90 + 360) % 360)}
            >
              <RotateCcw className="size-4" />
              {t("account.profile.rotateLeft")}
            </AppButton>
            <AppButton
              type="button"
              variant="secondary-outline"
              size="sm"
              onClick={() => setRotation((value) => (value + 90) % 360)}
            >
              <RotateCw className="size-4" />
              {t("account.profile.rotateRight")}
            </AppButton>
          </div>

          <div className="flex justify-end gap-2">
            <AppButton type="button" variant="secondary" size="md" onClick={onCancel} disabled={saving}>
              {t("account.deleteAccount.cancel")}
            </AppButton>
            <AppButton type="button" variant="primary" size="md" onClick={handleSave} disabled={saving}>
              {saving ? t("auth.pleaseWait") : t("account.profile.cropSave")}
            </AppButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
