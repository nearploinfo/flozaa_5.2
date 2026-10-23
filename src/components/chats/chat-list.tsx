"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { MessageCircle } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Skeleton } from "@/components/ui/skeleton";
import { BlockProvidersIcon, VerifiedBadgeIcon } from "@/components/icons/icons";
import { ChatListEmptyState } from "@/components/chats/chat-list-empty-state";
import { useTranslation } from "@/lib/i18n/translation-context";
import { cn } from "@/lib/utils";
import { chatBookingStatusKey } from "@/lib/chats/chat-types";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import type { ChatListItem, ChatListFilter } from "@/lib/chats/use-chat-list";
import { getBookingStatusLabel, getBookingStatusTextClass } from "@/lib/helpers";

interface ChatListProps {
  tab: ChatListFilter;
  onTabChange: (tab: ChatListFilter) => void;
  conversations: ChatListItem[];
  selectedChatId: string | null;
  onSelectChat: (conversation: ChatListItem) => void;
  isLoading: boolean;
  /** True while a next page is being fetched (not the initial load) — shows a footer row under the list. */
  isLoadingMore?: boolean;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  listRef?: React.RefObject<HTMLDivElement | null>;
  tabTotals: Record<ChatListFilter, number>;
  allowPreBookingChat: boolean;
  allowPostBookingChat: boolean;
  onOpenBlockedProviders: () => void;
}

export function ChatList({
  tab,
  onTabChange,
  conversations,
  selectedChatId,
  onSelectChat,
  isLoading,
  isLoadingMore,
  onScroll,
  listRef,
  tabTotals,
  allowPreBookingChat,
  allowPostBookingChat,
  onOpenBlockedProviders,
}: ChatListProps) {
  const { t } = useTranslation();

  return (
    <div className="flex w-full min-h-0 flex-1 flex-col items-start self-stretch overflow-hidden xl:w-96 xl:flex-none xl:rounded-tl-xl xl:rounded-bl-xl xl:border-r xl:border-border-default">
      <div className="flex w-full shrink-0 flex-col items-start">
        <div className="flex h-14 w-full items-center gap-2 bg-bg-primary px-4 py-2 shadow-[0px_8px_16px_0px_rgba(0,0,0,0.04)] xl:h-20 xl:gap-6 xl:border-b xl:border-border-default xl:px-6 xl:py-4 xl:shadow-none">
          <div className="flex flex-1 flex-col items-start justify-center">
            <span className="text-base font-medium text-text-primary xl:hidden">{t("chats.mobileTitle")}</span>
            <span className="hidden text-xl font-medium text-text-primary xl:inline">{t("chats.listTitle")}</span>
          </div>
          <button
            type="button"
            onClick={onOpenBlockedProviders}
            className="flex items-center justify-center gap-2 rounded-3xl bg-bg-primary p-2 xl:rounded-lg xl:border xl:border-border-default xl:bg-bg-secondary"
            aria-label={t("chats.blockedProviders")}
          >
            <BlockProvidersIcon className="size-6 text-button-secondary-outline-text" />
          </button>
        </div>
      </div>

      {/* Mobile: underline-style tabs. */}
      <div className="flex w-full items-center gap-4 bg-bg-primary px-4 shadow-[0px_8px_16px_0px_rgba(0,0,0,0.02)] xl:hidden">
        <button
          type="button"
          disabled={!allowPreBookingChat}
          onClick={() => allowPreBookingChat && onTabChange("pre_booking")}
          title={!allowPreBookingChat ? t("chats.preBookingChatDisabled") : undefined}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-3",
            tab === "pre_booking" ? "rounded-tl-lg rounded-tr-lg pt-2" : "py-2",
            !allowPreBookingChat && "cursor-not-allowed opacity-60"
          )}
        >
          <span className={cn("text-sm", tab === "pre_booking" ? "font-semibold text-text-brand" : "font-normal text-text-primary")}>
            {t("chats.enquiries")}
            {tabTotals.pre_booking > 0 && ` (${tabTotals.pre_booking})`}
          </span>
          {tab === "pre_booking" && <span className="h-1 w-full rounded-tl-lg rounded-tr-lg bg-bg-brand" />}
        </button>
        <button
          type="button"
          disabled={!allowPostBookingChat}
          onClick={() => allowPostBookingChat && onTabChange("booking")}
          title={!allowPostBookingChat ? t("chats.postBookingChatDisabled") : undefined}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-3",
            tab === "booking" ? "rounded-tl-lg rounded-tr-lg pt-2" : "py-2",
            !allowPostBookingChat && "cursor-not-allowed opacity-60"
          )}
        >
          <span className={cn("text-sm", tab === "booking" ? "font-semibold text-text-brand" : "font-normal text-text-primary")}>
            {t("chats.bookings")}
            {tabTotals.booking > 0 && ` (${tabTotals.booking})`}
          </span>
          {tab === "booking" && <span className="h-1 w-full rounded-tl-lg rounded-tr-lg bg-bg-brand" />}
        </button>
      </div>

      {/* Desktop: pill-style tabs, unchanged. */}
      <div className="hidden w-full items-center gap-4 bg-bg-primary p-6 xl:flex">
        <button
          type="button"
          disabled={!allowPreBookingChat}
          onClick={() => allowPreBookingChat && onTabChange("pre_booking")}
          title={!allowPreBookingChat ? t("chats.preBookingChatDisabled") : undefined}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-base",
            !allowPreBookingChat
              ? "cursor-not-allowed border border-border-default bg-bg-primary text-text-secondary opacity-60"
              : tab === "pre_booking"
                ? "bg-bg-inverse text-text-inverse-dark"
                : "border border-border-default bg-bg-primary text-text-primary"
          )}
        >
          {t("chats.enquiries")}
          {tabTotals.pre_booking > 0 && ` (${tabTotals.pre_booking})`}
        </button>
        <button
          type="button"
          disabled={!allowPostBookingChat}
          onClick={() => allowPostBookingChat && onTabChange("booking")}
          title={!allowPostBookingChat ? t("chats.postBookingChatDisabled") : undefined}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-base",
            !allowPostBookingChat
              ? "cursor-not-allowed border border-border-default bg-bg-primary text-text-secondary opacity-60"
              : tab === "booking"
                ? "bg-bg-inverse text-text-inverse-dark"
                : "border border-border-default bg-bg-primary text-text-primary"
          )}
        >
          {t("chats.bookings")}
          {tabTotals.booking > 0 && ` (${tabTotals.booking})`}
        </button>
      </div>

      <div
        ref={listRef}
        onScroll={onScroll}
        className="thin-scrollbar-brand flex w-full min-h-0 flex-1 flex-col items-start gap-3 overflow-y-auto p-3"
      >
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex w-full items-center gap-3 rounded-lg border border-border-default p-4">
              <Skeleton className="size-12 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))
        ) : conversations.length === 0 ? (
          <>
            {/* Mobile: this panel is the whole screen, room for the full illustration.
             * Desktop: it's a narrow w-96 sidebar column — the illustration goes in
             * ChatDetail's wide right panel instead; this stays a compact fallback
             * for the rare case that panel can't show it (e.g. support variant). */}
            <div className="flex w-full flex-1 items-center justify-center xl:hidden">
              <ChatListEmptyState
                title={t(tab === "pre_booking" ? "chats.emptyListEnquiries" : "chats.emptyListBookings")}
                description={t(
                  tab === "pre_booking" ? "chats.emptyListEnquiriesDescription" : "chats.emptyListBookingsDescription"
                )}
              />
            </div>
            <div className="hidden w-full flex-col items-center gap-2 py-10 text-center xl:flex">
              <span className="flex size-12 items-center justify-center rounded-full bg-bg-secondary">
                <MessageCircle className="size-6 text-icon-secondary" />
              </span>
              <span className="text-sm text-text-secondary">
                {t(tab === "pre_booking" ? "chats.emptyListEnquiries" : "chats.emptyListBookings")}
              </span>
            </div>
          </>
        ) : (
          conversations.map((conversation) => {
            const active = conversation.uniqueId === selectedChatId;
            const name = conversation.translated_partner_name || conversation.partner_name;
            const statusKey = chatBookingStatusKey(conversation.order_status);
            const unread = Number(conversation.un_read_chats ?? 0);
            const timestamp = conversation.updated_at
              ? formatDistanceToNowStrict(new Date(conversation.updated_at), { addSuffix: true })
              : null;

            const avatarRow = (
              <div className="flex w-full items-center gap-3">
                <div className="relative size-10 shrink-0 overflow-hidden rounded-full xl:size-12 xl:rounded-lg">
                  <AppImage src={conversation.image} alt={name} fill className="object-cover" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                  <span className="flex w-full min-w-0 items-center gap-1 text-sm font-semibold text-text-primary xl:text-base xl:font-normal">
                    <span className="truncate">{name}</span>
                    {conversation.is_provider_verified === 1 && (
                      <VerifiedBadgeIcon className="size-4 shrink-0 text-icon-brand" />
                    )}
                  </span>
                  {conversation.booking_id ? (
                    <span className="w-full truncate text-xs text-text-secondary xl:hidden">
                      {conversation.last_message || t("chats.preBookingEnquiry")}
                    </span>
                  ) : (
                    <span className="w-full truncate text-xs text-text-secondary xl:text-sm">
                      {conversation.last_message || t("chats.preBookingEnquiry")}
                    </span>
                  )}
                  {conversation.booking_id && statusKey && (
                    <div className="hidden items-center gap-2 xl:flex">
                      <span className="line-clamp-1 text-sm text-text-primary">ID:{conversation.booking_id}</span>
                      <span className="size-1 shrink-0 rounded-full bg-bg-inverse opacity-60" />
                      <span className={cn("line-clamp-1 text-sm", getBookingStatusTextClass(statusKey))}>
                        {getBookingStatusLabel(statusKey)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {timestamp && (
                    <span
                      className={cn(
                        "text-xs text-text-secondary",
                        conversation.booking_id && unread > 0 && "text-text-brand xl:text-text-secondary"
                      )}
                    >
                      {timestamp}
                    </span>
                  )}
                  {unread > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-bg-brand px-1.5 text-[10px] text-text-inverse-light xl:size-6 xl:rounded-3xl xl:text-xs">
                      {String(unread).padStart(2, "0")}
                    </span>
                  )}
                </div>
              </div>
            );

            return (
              <button
                key={conversation.uniqueId}
                type="button"
                onClick={() => onSelectChat(conversation)}
                className={cn(
                  "flex w-full flex-col items-start gap-3 rounded-xl bg-card-bg p-3 text-start xl:rounded-lg xl:p-4",
                  active ? "xl:border xl:border-border-brand xl:bg-bg-brand-subtle" : "xl:border xl:border-border-default xl:bg-bg-primary"
                )}
              >
                {conversation.booking_id && statusKey && (
                  <>
                    <div className="flex w-full items-center justify-between xl:hidden">
                      <span className="rounded-sm bg-bg-secondary px-2 py-1 text-xs text-text-primary">
                        #{conversation.booking_id}
                      </span>
                      <BookingStatusBadge statusKey={statusKey} fallbackLabel={conversation.order_status ?? ""} />
                    </div>
                    <div className="dashed-divider xl:hidden" />
                  </>
                )}
                {avatarRow}
              </button>
            );
          })
        )}
        {isLoadingMore && conversations.length > 0 && (
          <div className="flex w-full items-center gap-3 rounded-lg border border-border-default p-4">
            <Skeleton className="size-12 shrink-0 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
