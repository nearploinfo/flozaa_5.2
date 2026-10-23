"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { AppTag } from "@/components/ui/app-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { BrochureIcon, DownloadIcon } from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";

function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.substring(path.lastIndexOf("/") + 1)) || url;
  } catch {
    return url;
  }
}

async function downloadFile(href: string, fileName: string) {
  const response = await fetch(href);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(blobUrl);
}

export function BrochureFilesSection({ files }: { files: string[] }) {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState<string | null>(null);
  return (
    <>
      <BrochureFilesMobile files={files} />

    <div className="hidden flex-col items-start gap-4 self-stretch rounded-xl border border-border-default bg-bg-primary p-6 xl:flex">
      <h2 className="self-stretch text-lg font-medium text-text-primary">
        {t("services.brochureFiles.title")}
      </h2>
      <div className="dashed-divider" />

      {files.length === 0 ? (
        <EmptyState
          icon={BrochureIcon}
          title={t("services.brochureFiles.emptyTitle")}
          description={t("services.brochureFiles.emptyDescription")}
        />
      ) : (
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {files.map((href) => {
          const fileName = fileNameFromUrl(href);
          return (
            <div
              key={href}
              className="flex items-center gap-3 rounded-lg border border-border-default bg-bg-primary p-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <AppTag
                  shape="box"
                  className="shrink-0 rounded-sm"
                  leftIcon={BrochureIcon}
                  iconClassName="size-5 text-icon-primary"
                />
                <div className="flex min-w-0 flex-1 items-center">
                  <span className="truncate text-lg text-text-primary">{fileName}</span>
                </div>
              </div>
              <AppButton
                variant="secondary"
                size="sm"
                iconOnly
                leftIcon={DownloadIcon}
                disabled={downloading === href}
                aria-label={t("services.brochureFiles.download", { fileName })}
                onClick={async () => {
                  setDownloading(href);
                  try {
                    await downloadFile(href, fileName);
                  } finally {
                    setDownloading(null);
                  }
                }}
              >
                {t("services.brochureFiles.download", { fileName })}
              </AppButton>
            </div>
          );
        })}
      </div>
      )}
    </div>
    </>
  );
}

/** max-lg layout: no card, file names as wrapping download chips. */
function BrochureFilesMobile({ files }: { files: string[] }) {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState<string | null>(null);

  return (
    <section className="flex flex-col items-start gap-4 border-b border-dashed border-border-default py-6 xl:hidden">
      <h2 className="text-lg font-semibold text-text-primary">
        {t("services.brochureFiles.mobileTitle")}
      </h2>

      {files.length === 0 ? (
        <EmptyState
          icon={BrochureIcon}
          title={t("services.brochureFiles.emptyTitle")}
          description={t("services.brochureFiles.emptyDescription")}
        />
      ) : (
        <div className="flex w-full flex-wrap items-center gap-3">
          {files.map((href) => {
            const fileName = fileNameFromUrl(href);
            return (
              <button
                key={href}
                type="button"
                disabled={downloading === href}
                aria-label={t("services.brochureFiles.download", { fileName })}
                onClick={async () => {
                  setDownloading(href);
                  try {
                    await downloadFile(href, fileName);
                  } finally {
                    setDownloading(null);
                  }
                }}
                className="flex min-w-0 max-w-full items-center gap-3 rounded-lg border border-border-default bg-bg-primary px-3 py-2.5 disabled:opacity-60"
              >
                <span className="min-w-0 flex-1 truncate text-start text-sm text-text-primary wrap-break-word">
                  {fileName}
                </span>
                <DownloadIcon className="size-5 shrink-0 text-icon-primary" />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
