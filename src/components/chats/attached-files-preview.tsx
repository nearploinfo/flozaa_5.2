"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import { DocumentAttachmentIcon } from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";

function FileThumb({ file }: { file: File }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derives the blob preview URL from the File prop
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  if (isImage && previewUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- ephemeral local blob preview, not an app asset
    return <img src={previewUrl} alt={file.name} className="size-full object-cover" />;
  }

  return (
    <span className="flex size-full flex-col items-center justify-center gap-1 p-1">
      <DocumentAttachmentIcon className="size-5 text-icon-brand" />
      <span className="line-clamp-1 w-full text-center text-[10px] text-text-secondary">{file.name}</span>
    </span>
  );
}

export function AttachedFilesPreview({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (index: number) => void;
}) {
  const { t } = useTranslation();
  if (files.length === 0) return null;

  return (
    <div className="flex w-full flex-wrap items-center gap-2 border-t border-border-default p-2">
      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border-default bg-bg-secondary"
        >
          <FileThumb file={file} />
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={t("common.remove")}
            className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-bg-inverse-dark/70"
          >
            <XIcon className="size-2.5 text-text-inverse-light" />
          </button>
        </div>
      ))}
    </div>
  );
}
