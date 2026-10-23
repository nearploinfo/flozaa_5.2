"use client";

import { useAppSelector } from "@/store/hooks";

interface CustomJobSettingsApi {
  max_files_allowed?: number | string;
  max_file_size_images?: number | string;
  max_file_size_video?: number | string;
  max_file_size_other?: number | string;
  allow_image_uploads?: number | string;
  allow_video_uploads?: number | string;
  allow_document_uploads?: number | string;
}

export interface CustomJobFileLimits {
  maxFiles: number;
  imageMb: number;
  videoMb: number;
  otherMb: number;
  allowImage: boolean;
  allowVideo: boolean;
  allowDocument: boolean;
}

function toNumber(value: number | string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function toFlag(value: number | string | undefined): boolean {
  return value === 1 || value === "1";
}

/** Upload limits/flags for the custom-job-request form, from general settings (falls back to sane defaults if unset). */
export function useCustomJobFileLimits(): CustomJobFileLimits {
  const settings = useAppSelector(
    (state) => state.settings.data?.custom_job_settings as CustomJobSettingsApi | undefined
  );

  return {
    maxFiles: toNumber(settings?.max_files_allowed, 5),
    imageMb: toNumber(settings?.max_file_size_images, 5),
    videoMb: toNumber(settings?.max_file_size_video, 100),
    otherMb: toNumber(settings?.max_file_size_other, 10),
    allowImage: toFlag(settings?.allow_image_uploads),
    allowVideo: toFlag(settings?.allow_video_uploads),
    allowDocument: toFlag(settings?.allow_document_uploads),
  };
}
