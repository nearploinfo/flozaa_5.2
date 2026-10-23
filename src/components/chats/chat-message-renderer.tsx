"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { AppImage } from "@/components/ui/app-image";
import { DownloadIcon } from "@/components/icons/icons";
import { parseChatFiles, type ChatFile, type ChatMessageApi } from "@/lib/chats/chat-types";
import { cn } from "@/lib/utils";

function ImageGrid({
  images,
  isMe,
  onOpenLightbox,
}: {
  images: ChatFile[];
  isMe: boolean;
  onOpenLightbox: (index: number, images: ChatFile[]) => void;
}) {
  if (images.length === 0) return null;
  const visible = images.slice(0, 4);
  const overflowCount = images.length - 4;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", isMe ? "justify-end" : "justify-start")}>
      {visible.map((file, index) => (
        <button
          key={`${file.file}-${index}`}
          type="button"
          onClick={() => onOpenLightbox(index, images)}
          className="relative size-24 shrink-0 overflow-hidden rounded-sm border border-border-default"
        >
          <AppImage src={file.file} alt={file.file_name} fill className="object-cover" />
          {index === 3 && overflowCount > 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-bg-inverse-dark/60 text-lg font-medium text-text-inverse-light">
              +{overflowCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function NonImageFiles({ files, isMe }: { files: ChatFile[]; isMe: boolean }) {
  if (files.length === 0) return null;
  return (
    <div className={cn("flex flex-col gap-2", isMe ? "items-end" : "items-start")}>
      {files.map((file, index) =>
        file.file_type === "video/mp4" ? (
          <video key={`${file.file}-${index}`} controls className="w-64 rounded-sm">
            <source src={file.file} type="video/mp4" />
          </video>
        ) : (
          <a
            key={`${file.file}-${index}`}
            href={file.file}
            target="_blank"
            rel="noopener noreferrer"
            download={file.file_name}
            className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-secondary px-3 py-2"
          >
            <span className="line-clamp-1 max-w-48 text-sm text-text-primary">{file.file_name}</span>
            <DownloadIcon className="size-4 shrink-0 text-icon-primary" />
          </a>
        )
      )}
    </div>
  );
}

export function ChatMessageRenderer({
  message,
  isMe,
  senderAvatar,
  senderName,
  onOpenLightbox,
}: {
  message: ChatMessageApi;
  isMe: boolean;
  senderAvatar?: string;
  senderName?: string;
  onOpenLightbox: (index: number, images: ChatFile[]) => void;
}) {
  const files = parseChatFiles(message.file);
  const imageFiles = files.filter((file) => file.file_type?.startsWith("image/"));
  const otherFiles = files.filter((file) => !file.file_type?.startsWith("image/"));
  const hasText = Boolean(message.message?.trim());
  // sender_details.image is authoritative (the API returns it per-message) — fall back
  // to the caller-supplied avatar for the optimistic bubble, which has no sender_details.image yet.
  const avatar = message.sender_details?.image || senderAvatar;

  if (!hasText && files.length === 0) return null;

  return (
    <div className={cn("flex w-full items-start gap-2", isMe ? "justify-end pl-8" : "justify-start pr-8")}>
      {!isMe && (
        <div className="relative size-8 shrink-0 overflow-hidden rounded-full">
          <AppImage src={avatar ?? ""} alt={senderName ?? ""} fill className="object-cover" />
        </div>
      )}
      <div className={cn("flex min-w-0 max-w-[85%] flex-col items-end gap-2", !isMe && "items-start")}>
        {hasText && (
          <div
            className={cn(
              "min-w-0 max-w-full px-3 py-2",
              isMe
                ? "rounded-tl-lg rounded-tr-lg rounded-bl-lg bg-bg-brand text-end text-text-inverse-light"
                : "rounded-tl-lg rounded-tr-lg rounded-br-lg bg-bg-primary text-text-primary xl:bg-bg-secondary"
            )}
          >
            <span className="whitespace-pre-line break-words text-sm">{message.message}</span>
          </div>
        )}
        <ImageGrid images={imageFiles} isMe={isMe} onOpenLightbox={onOpenLightbox} />
        <NonImageFiles files={otherFiles} isMe={isMe} />
        <span className="text-xs text-text-secondary">
          {formatDistanceToNowStrict(new Date(message.created_at), { addSuffix: true })}
        </span>
      </div>
      {isMe && (
        <div className="relative size-8 shrink-0 overflow-hidden rounded-full">
          <AppImage src={avatar ?? ""} alt={senderName ?? ""} fill className="object-cover" />
        </div>
      )}
    </div>
  );
}
