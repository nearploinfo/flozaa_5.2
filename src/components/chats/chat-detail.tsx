"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Calendar, MessageCircle, Send } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { AppImage } from "@/components/ui/app-image";
import { Link } from "@/components/ui/locale-link";
import { GalleryLightbox } from "@/components/ui/gallery-lightbox";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BlockUserIcon,
  ChatOptionsIcon,
  ClockIcon,
  DeleteChatIcon,
  DocumentAttachmentIcon,
  ImageAttachmentIcon,
  PlusIcon,
} from "@/components/icons/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { BlockReportModal } from "@/components/chats/block-report-modal";
import { UnblockDialog } from "@/components/chats/unblock-dialog";
import { DeleteMessagesDialog } from "@/components/chats/delete-messages-dialog";
import { ChatQuestions } from "@/components/chats/chat-questions";
import { AttachedFilesPreview } from "@/components/chats/attached-files-preview";
import { ChatMessageRenderer } from "@/components/chats/chat-message-renderer";
import { ChatListEmptyState } from "@/components/chats/chat-list-empty-state";
import { getReportReasonsApi } from "@/api/apiRoutes";
import { useTranslation } from "@/lib/i18n/translation-context";
import { cn } from "@/lib/utils";
import { getBookingStatusLabel, getBookingStatusTextClass } from "@/lib/helpers";
import { useDateTimeFormatter } from "@/lib/use-date-time-formatter";
import type { ChatFile, ChatMessageApi } from "@/lib/chats/chat-types";
import { chatBookingStatusKey } from "@/lib/chats/chat-types";
import type { BlockedStatus } from "@/lib/chats/use-chat-messages";
import { useChatSettings } from "@/lib/chats/use-chat-settings";
import type { ChatListFilter } from "@/lib/chats/use-chat-list";
import { localizePath } from "@/lib/i18n/locale-path";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
const DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "zip", "rar"];

function dayKey(dateStr: string): string {
  return format(new Date(dateStr), "yyyy-MM-dd");
}

function DayDivider({ dateStr }: { dateStr: string }) {
  const { t } = useTranslation();
  const date = new Date(dateStr);
  const label = isToday(date)
    ? t("chats.today")
    : isYesterday(date)
      ? t("chats.yesterday", { date: format(date, "d MMMM") })
      : format(date, "d MMMM yyyy");
  return (
    <div className="flex w-full justify-center">
      <span className="rounded-2xl bg-bg-tertiary px-4 py-2 text-xs text-text-primary">{label}</span>
    </div>
  );
}

export interface ChatDetailConversation {
  partnerId: number;
  bookingId: number | null;
  name: string;
  avatar: string;
  orderStatus?: string;
  serviceTitle?: string;
  extraServicesCount?: number;
  dateOfService?: string;
  startingTime?: string;
}

interface ChatDetailProps {
  conversation: ChatDetailConversation | null;
  /** True when the whole chat list is empty (not just "nothing selected
   * yet") — swaps the plain placeholder for the full no-messages
   * illustration, since this panel has the room for it and the list's own
   * narrow sidebar column doesn't. Pass the active tab too, for the
   * enquiries/bookings-specific copy. */
  isListEmpty?: boolean;
  activeTab?: ChatListFilter;
  variant?: "default" | "support";
  chatMessages: ChatMessageApi[];
  isLoadingMessages: boolean;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  currentUserId: number | string | undefined;
  currentUserImage?: string;
  message: string;
  onMessageChange: (value: string) => void;
  attachedFiles: File[];
  onAttachedFilesChange: (files: File[]) => void;
  onSend: (questionText?: string) => void;
  isSending: boolean;
  blockedStatus: BlockedStatus;
  handyman?: { name: string; image?: string } | null;
  onBlock: (data: { reason_id: number | null; additional_info: string }) => Promise<void> | void;
  onUnblock: () => void;
  onDelete: () => void;
  /** Mobile-only "back to list" button in the header — desktop always shows
   * the list alongside, so it has nothing to go "back" from. */
  onBack?: () => void;
}

export function ChatDetail({
  conversation,
  isListEmpty,
  activeTab,
  variant = "default",
  chatMessages,
  isLoadingMessages,
  onScroll,
  currentUserId,
  currentUserImage,
  message,
  onMessageChange,
  attachedFiles,
  onAttachedFilesChange,
  onSend,
  isSending,
  blockedStatus,
  handyman,
  onBlock,
  onUnblock,
  onDelete,
  onBack,
}: ChatDetailProps) {
  const { t, lang, defaultLocale } = useTranslation();
  const settings = useChatSettings();
  const { formatBookingDate, formatBookingTime } = useDateTimeFormatter();
  const [blockReportOpen, setBlockReportOpen] = useState(false);
  const [checkingReportReasons, setCheckingReportReasons] = useState(false);
  const [unblockOpen, setUnblockOpen] = useState(false);
  const [deleteMessagesOpen, setDeleteMessagesOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<ChatFile[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const isSupport = variant === "support";

  if (!conversation) {
    return (
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-4 self-stretch",
          isSupport ? "rounded-xl" : "rounded-tr-xl rounded-br-xl"
        )}
      >
        {isListEmpty ? (
          <ChatListEmptyState
            title={t(activeTab === "pre_booking" ? "chats.emptyListEnquiries" : "chats.emptyListBookings")}
            description={t(
              activeTab === "pre_booking"
                ? "chats.emptyListEnquiriesDescription"
                : "chats.emptyListBookingsDescription"
            )}
          />
        ) : (
          <>
            <span className="flex size-16 items-center justify-center rounded-full bg-bg-secondary">
              <MessageCircle className="size-8 text-icon-secondary" />
            </span>
            <span className="text-base text-text-secondary">{t("chats.emptySelectConversation")}</span>
          </>
        )}
      </div>
    );
  }

  const statusKey = chatBookingStatusKey(conversation.orderStatus);
  const isOrderDisabled = statusKey === "cancelled" || statusKey === "completed";
  const isPreBookingChat = !conversation.bookingId;
  const isChatTypeDisabled = isPreBookingChat ? !settings.allowPreBookingChat : !settings.allowPostBookingChat;
  const chatTypeDisabledMessage = isPreBookingChat
    ? t("chats.preBookingChatDisabled")
    : t("chats.postBookingChatDisabled");
  const isInputDisabled = isOrderDisabled || blockedStatus.isBlocked || isChatTypeDisabled;

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>, type: "image" | "file") => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    const validFiles = files.filter((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const isImg = IMAGE_EXTENSIONS.includes(ext);
      const isDoc = DOCUMENT_EXTENSIONS.includes(ext);
      if (type === "image" && !isImg) {
        toast.error(`${t("chats.fileNotSupported")}: ${file.name}`);
        return false;
      }
      if (type === "file" && !isDoc) {
        toast.error(`${t("chats.fileNotSupported")}: ${file.name}`);
        return false;
      }
      if (file.size / (1024 * 1024) > settings.maxFileSizeMB) {
        toast.error(t("chats.fileTooLarge", { name: file.name, size: settings.maxFileSizeMB }));
        return false;
      }
      return true;
    });

    const combined = [...attachedFiles, ...validFiles];
    if (combined.length > settings.maxFilesPerMessage) {
      toast.error(t("chats.tooManyFiles", { count: settings.maxFilesPerMessage }));
    }
    onAttachedFilesChange(combined.slice(0, settings.maxFilesPerMessage));
  };

  const handleOpenLightbox = (index: number, images: ChatFile[]) => {
    setLightboxImages(images);
    setLightboxIndex(index);
  };

  const handleBlockClick = async () => {
    setCheckingReportReasons(true);
    try {
      const response = await getReportReasonsApi();
      const hasReasons = Array.isArray(response?.data) && response.data.length > 0;
      if (hasReasons) {
        setBlockReportOpen(true);
      } else {
        await onBlock({ reason_id: null, additional_info: "" });
      }
    } catch {
      await onBlock({ reason_id: null, additional_info: "" });
    } finally {
      setCheckingReportReasons(false);
    }
  };

  const questionsType = isSupport ? "customer_admin_support" : isPreBookingChat ? "pre_booking" : "post_booking";
  const questionsTitle = isSupport
    ? t("chats.troubleWithSupport")
    : isPreBookingChat
      ? t("chats.preBookingQuestionsTitle")
      : t("chats.postBookingQuestionsTitle");
  const showQuickQuestions = chatMessages.length === 0 && !isLoadingMessages && !blockedStatus.isBlocked;

  return (
    <div
      className={cn(
        "flex h-full w-full min-h-0 min-w-0 flex-1 flex-col items-start self-stretch overflow-hidden",
        isSupport ? "xl:rounded-xl" : "xl:rounded-tr-xl xl:rounded-br-xl"
      )}
    >
      {isSupport ? (
        <div className="flex w-full shrink-0 items-center justify-center gap-4 border-b border-border-default bg-bg-primary p-4 xl:p-6">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label={t("serviceRequests.back")}
              className="flex size-8 shrink-0 items-center justify-center xl:hidden"
            >
              <ArrowLeftIcon className="size-6 text-text-primary rtl:rotate-180" />
            </button>
          )}
          <span className="flex-1 text-lg font-medium text-text-primary xl:text-xl">{conversation.name}</span>
        </div>
      ) : (
        <div className="flex h-16 w-full shrink-0 items-center gap-3 border-b border-border-default bg-bg-primary p-4 xl:h-20 xl:gap-6">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label={t("serviceRequests.back")}
              className="flex size-8 shrink-0 items-center justify-center xl:hidden"
            >
              <ArrowLeftIcon className="size-6 text-text-primary rtl:rotate-180" />
            </button>
          )}
          <div className="flex flex-1 items-center gap-3 rounded-lg">
            <div className="relative size-11 shrink-0 overflow-hidden rounded-full xl:size-12 xl:rounded-lg">
              <AppImage src={conversation.avatar} alt={conversation.name} fill className="object-cover" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
              <span className="line-clamp-1 w-full text-base font-medium text-text-primary xl:font-normal">
                {conversation.name}
              </span>
              {conversation.bookingId ? (
                <div className="flex items-center gap-2">
                  <span className="line-clamp-1 text-xs text-text-brand xl:hidden">#{conversation.bookingId}</span>
                  <span className="hidden line-clamp-1 text-sm text-text-secondary xl:inline">
                    ID:{conversation.bookingId}
                  </span>
                  {statusKey && (
                    <>
                      <span className="hidden size-1 shrink-0 rounded-full bg-bg-inverse opacity-60 xl:block" />
                      <span className={cn("hidden whitespace-nowrap text-sm xl:inline", getBookingStatusTextClass(statusKey))}>
                        {getBookingStatusLabel(statusKey)}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <span className="line-clamp-1 w-full text-sm text-text-secondary">
                  {t("chats.preBookingEnquiry")}
                </span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-lg p-2 xl:bg-bg-secondary"
                aria-label={t("chats.chatOptions")}
              >
                <ChatOptionsIcon className="size-6 text-text-primary xl:text-button-secondary-outline-text" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 gap-3 p-3">
              {!isOrderDisabled && !isChatTypeDisabled && (
                <DropdownMenuItem
                  disabled={checkingReportReasons}
                  onClick={() => (blockedStatus.blockedByUser ? setUnblockOpen(true) : handleBlockClick())}
                  className="gap-2"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-3xl bg-bg-secondary">
                    <BlockUserIcon className="size-5 text-icon-primary" />
                  </span>
                  <span className="flex-1 text-sm text-text-primary">
                    {blockedStatus.blockedByUser ? t("chats.unblock") : t("chats.blockAndReport")}
                  </span>
                </DropdownMenuItem>
              )}
              {chatMessages.length > 0 && (
                <DropdownMenuItem variant="destructive" onClick={() => setDeleteMessagesOpen(true)} className="gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-3xl bg-alert-error-bg">
                    <DeleteChatIcon className="size-5 text-alert-error-text" />
                  </span>
                  <span className="flex-1 text-sm text-alert-error-text">{t("chats.deleteMessages")}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {conversation.bookingId != null && conversation.serviceTitle && (
        <div className="flex w-full min-w-0 shrink-0 items-center gap-4 bg-bg-primary p-4 shadow-[0px_8px_16px_0px_rgba(0,0,0,0.02)] xl:shadow-none xl:border-b xl:border-border-default">
          <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
            <div className="flex w-full items-center gap-2">
              <span className="line-clamp-1 text-sm font-medium text-text-primary">
                {conversation.serviceTitle}
              </span>
              {!!conversation.extraServicesCount && (
                <span className="shrink-0 text-sm text-text-secondary">
                  {t("bookings.card.more", { count: conversation.extraServicesCount })}
                </span>
              )}
            </div>
            <div className="flex w-full items-center gap-2">
              {conversation.dateOfService && (
                <span className="flex items-center gap-1 text-sm text-text-secondary">
                  <Calendar className="size-3.5 shrink-0 text-icon-primary opacity-75" />
                  {formatBookingDate(conversation.dateOfService)}
                </span>
              )}
              {conversation.dateOfService && conversation.startingTime && (
                <span className="size-1 shrink-0 rounded-full bg-bg-inverse opacity-60" />
              )}
              {conversation.startingTime && (
                <span className="flex items-center gap-1 text-sm text-text-secondary">
                  <ClockIcon className="size-3.5 shrink-0 text-icon-primary opacity-75" />
                  {formatBookingTime(conversation.startingTime, conversation.dateOfService)}
                </span>
              )}
            </div>
          </div>
          {statusKey && <BookingStatusBadge statusKey={statusKey} fallbackLabel={conversation.orderStatus ?? ""} />}
          <Link
            href={localizePath(`/booking/${conversation.bookingId}`, lang, defaultLocale)}
            aria-label={t("bookings.card.viewBooking")}
            className="flex shrink-0 items-center justify-center p-1 text-button-link-primary-text"
          >
            <ArrowRightIcon className="size-5 rtl:rotate-180" />
          </Link>
        </div>
      )}

      {handyman && (
        <div className="flex w-full shrink-0 items-center gap-3 bg-bg-primary p-4 shadow-[0px_8px_16px_0px_rgba(0,0,0,0.02)] xl:shadow-none xl:border-b xl:border-border-default">
          <div className="relative size-8 shrink-0 overflow-hidden rounded-full xl:size-11">
            <AppImage src={handyman.image ?? ""} alt={handyman.name} fill className="object-cover" />
          </div>
          <div className="flex flex-1 flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">{handyman.name}</span>
              <span className="size-1 shrink-0 rounded-full bg-bg-inverse opacity-60" />
              <span className="line-clamp-1 text-sm text-text-brand">{t("chats.handyman")}</span>
            </div>
            <span className="text-sm text-text-secondary">{t("chats.handymanBannerDescription")}</span>
          </div>
        </div>
      )}

      <div
        onScroll={onScroll}
        className="chat_messages_screen thin-scrollbar-brand flex w-full min-h-0 flex-1 flex-col items-start gap-6 overflow-y-auto p-4"
      >
        {isLoadingMessages ? (
          <div className="flex w-full flex-1 flex-col gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={cn("flex w-full", index % 2 === 0 ? "justify-start" : "justify-end")}>
                <div className="h-10 w-48 animate-pulse rounded-lg bg-bg-secondary" />
              </div>
            ))}
          </div>
        ) : chatMessages.length === 0 ? (
          showQuickQuestions ? (
            <ChatQuestions type={questionsType} title={questionsTitle} onSelect={(question) => onSend(question)} />
          ) : (
            <div className="flex w-full flex-1 items-center justify-center">
              <span className="text-sm text-text-secondary">{t("chats.emptyMessages")}</span>
            </div>
          )
        ) : (
          <div className="flex w-full flex-col gap-3">
            {[...chatMessages].reverse().map((msg, index, chronological) => {
              const isMe = currentUserId != null && (currentUserId === msg.sender_id || currentUserId === msg.sender_details?.id);
              const previous = chronological[index - 1];
              const isFirstOfDay = !previous || dayKey(previous.created_at) !== dayKey(msg.created_at);
              return (
                <div key={msg.id ?? `${msg.sender_id}-${msg.created_at}-${index}`} className="flex w-full flex-col gap-3">
                  {isFirstOfDay && <DayDivider dateStr={msg.created_at} />}
                  <ChatMessageRenderer
                    message={msg}
                    isMe={isMe}
                    senderAvatar={isMe ? currentUserImage : conversation.avatar}
                    senderName={conversation.name}
                    onOpenLightbox={handleOpenLightbox}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {blockedStatus.isBlocked ? (
        <div
          className={cn(
            "flex w-full shrink-0 items-center justify-center gap-3 border-t border-border-default bg-bg-primary p-4 text-center text-sm text-text-secondary",
            isSupport ? "rounded-bl-xl rounded-br-xl" : "rounded-br-xl"
          )}
        >
          {blockedStatus.message}
        </div>
      ) : isInputDisabled ? (
        <div
          className={cn(
            "flex w-full shrink-0 items-center justify-center gap-3 border-t border-border-default bg-alert-warning-bg p-4 text-center text-sm text-text-primary",
            isSupport ? "rounded-bl-xl rounded-br-xl" : "rounded-br-xl"
          )}
        >
          {isOrderDisabled
            ? t("chats.orderDisabledMessage")
            : isChatTypeDisabled
              ? chatTypeDisabledMessage
              : t("chats.cantSendMessage")}
        </div>
      ) : (
        <div
          className={cn(
            "flex w-full shrink-0 flex-col items-start border-t border-border-default bg-bg-primary",
            isSupport ? "rounded-bl-xl rounded-br-xl" : "rounded-br-xl"
          )}
        >
          <AttachedFilesPreview files={attachedFiles} onRemove={(index) => onAttachedFilesChange(attachedFiles.filter((_, i) => i !== index))} />
          <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileAttachment(e, "image")} />
          <input
            ref={documentInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
            className="hidden"
            onChange={(e) => handleFileAttachment(e, "file")}
          />
          {(() => {
            const attachTrigger = (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="flex shrink-0 items-center justify-center" aria-label={t("chats.attach")}>
                    <PlusIcon className="size-6 text-icon-tertiary" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="w-40 gap-3 p-2">
                  {settings.isImageUploadEnabled && (
                    <DropdownMenuItem onClick={() => imageInputRef.current?.click()} className="gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bg-brand-subtle">
                        <ImageAttachmentIcon className="size-5 text-text-brand" />
                      </span>
                      <span className="flex-1 text-sm text-text-primary">{t("chats.attachImage")}</span>
                    </DropdownMenuItem>
                  )}
                  {settings.isFileUploadEnabled && (
                    <DropdownMenuItem onClick={() => documentInputRef.current?.click()} className="gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bg-brand-subtle">
                        <DocumentAttachmentIcon className="size-5 text-text-brand" />
                      </span>
                      <span className="flex-1 text-sm text-text-primary">{t("chats.attachDocument")}</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
            const inputField = (
              <input
                type="text"
                value={message}
                onChange={(event) => {
                  if (event.target.value.length <= settings.maxCharacters) onMessageChange(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    if (message.trim() || attachedFiles.length > 0) onSend();
                  }
                }}
                placeholder={t("chats.typeMessage")}
                className="w-full flex-1 bg-transparent text-sm text-text-primary placeholder:text-form-field-placeholder outline-none"
              />
            );
            const canSend = !isSending && (message.trim() || attachedFiles.length > 0);
            return (
              <>
                {/* Mobile: filled pill (input + attach icon) + circular send button. */}
                <div className="flex w-full items-center gap-3 p-4 xl:hidden">
                  <div className="flex flex-1 items-center gap-3 rounded-lg bg-bg-secondary p-3">
                    {inputField}
                    {(settings.isImageUploadEnabled || settings.isFileUploadEnabled) && attachTrigger}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSend()}
                    className="flex shrink-0 items-center justify-center rounded-full bg-bg-brand p-2 disabled:opacity-50"
                    aria-label={t("chats.send")}
                    disabled={!canSend}
                  >
                    <Send className="size-5 text-icon-inverse" />
                  </button>
                </div>

                {/* Desktop: separate attach button + outlined input + square send button, unchanged. */}
                <div className="hidden w-full items-center gap-3 p-4 xl:flex">
                  {(settings.isImageUploadEnabled || settings.isFileUploadEnabled) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center justify-center gap-2 rounded-lg bg-bg-secondary p-2"
                          aria-label={t("chats.attach")}
                        >
                          <PlusIcon className="size-6 text-button-secondary-outline-text" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" side="top" className="w-40 gap-3 p-2">
                        {settings.isImageUploadEnabled && (
                          <DropdownMenuItem onClick={() => imageInputRef.current?.click()} className="gap-2">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bg-brand-subtle">
                              <ImageAttachmentIcon className="size-5 text-text-brand" />
                            </span>
                            <span className="flex-1 text-sm text-text-primary">{t("chats.attachImage")}</span>
                          </DropdownMenuItem>
                        )}
                        {settings.isFileUploadEnabled && (
                          <DropdownMenuItem onClick={() => documentInputRef.current?.click()} className="gap-2">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bg-brand-subtle">
                              <DocumentAttachmentIcon className="size-5 text-text-brand" />
                            </span>
                            <span className="flex-1 text-sm text-text-primary">{t("chats.attachDocument")}</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <div className="flex flex-1 flex-col items-start gap-2">
                    <div className="flex w-full items-center gap-3 rounded-sm border border-form-field-border px-4 py-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(event) => {
                          if (event.target.value.length <= settings.maxCharacters) onMessageChange(event.target.value);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            if (message.trim() || attachedFiles.length > 0) onSend();
                          }
                        }}
                        placeholder={t("chats.typeMessage")}
                        className="w-full flex-1 bg-transparent text-base text-text-primary placeholder:text-form-field-placeholder outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSend()}
                    className="flex items-center justify-center gap-2 rounded-lg bg-button-primary-bg p-2 disabled:opacity-50"
                    aria-label={t("chats.send")}
                    disabled={!canSend}
                  >
                    <Send className="size-5 text-button-primary-text" />
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      <BlockReportModal open={blockReportOpen} onOpenChange={setBlockReportOpen} onSubmit={onBlock} />
      <UnblockDialog
        open={unblockOpen}
        onOpenChange={setUnblockOpen}
        onConfirm={() => {
          onUnblock();
          setUnblockOpen(false);
        }}
      />
      <DeleteMessagesDialog
        open={deleteMessagesOpen}
        onOpenChange={setDeleteMessagesOpen}
        onConfirm={onDelete}
      />

      <GalleryLightbox
        images={(lightboxImages ?? []).map((file) => file.file)}
        title={t("chats.attach")}
        open={lightboxImages !== null}
        activeIndex={lightboxIndex}
        onOpenChange={(open) => {
          if (!open) setLightboxImages(null);
        }}
        onActiveIndexChange={setLightboxIndex}
      />
    </div>
  );
}
