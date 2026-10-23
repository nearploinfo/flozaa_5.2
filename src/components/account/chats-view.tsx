"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { ChatList } from "@/components/chats/chat-list";
import { ChatDetail, type ChatDetailConversation } from "@/components/chats/chat-detail";
import { BlockedProvidersModal } from "@/components/chats/blocked-providers-modal";
import { blockUserApi, deleteChatUserApi, unblockUserApi } from "@/api/apiRoutes";
import { cn } from "@/lib/utils";
import { useChatList, type ChatListFilter, type ChatListItem } from "@/lib/chats/use-chat-list";
import { useChatMessages } from "@/lib/chats/use-chat-messages";
import { parseChatUniqueId } from "@/lib/chats/chat-types";
import { localizePath } from "@/lib/i18n/locale-path";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSupportChatOpen } from "@/store/slices/chat-ui-slice";

function scrollChatToBottom() {
  document.querySelectorAll(".chat_messages_screen").forEach((el) => {
    el.scrollTop = el.scrollHeight;
  });
}

export function ChatsView() {
  const { t, lang, defaultLocale } = useTranslation();
  const title = t("chats.title");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  const chatIdParam = Array.isArray(router.query.chatId) ? router.query.chatId[0] : undefined;
  const isSupport = chatIdParam === "admin";
  // The list page (no chatId) carries its own active tab as `?tab=`, not derivable from the
  // id suffix — needed because _app's ErrorBoundary keys on pathname and remounts this whole
  // component on every list<->thread transition (e.g. navigating back from a booking chat),
  // which would otherwise always reset filterType to its "no id" default of pre_booking.
  const tabParam = typeof router.query.tab === "string" ? router.query.tab : undefined;

  const [filterType, setFilterType] = useState<ChatListFilter>(() => {
    if (chatIdParam && chatIdParam !== "admin") return chatIdParam.endsWith("_pre") ? "pre_booking" : "booking";
    return tabParam === "booking" ? "booking" : "pre_booking";
  });
  const [blockedProvidersOpen, setBlockedProvidersOpen] = useState(false);

  // At xl+ the account sidebar sits beside the chat panel and the panel must never grow
  // taller than it (sidebar is display:none below xl, so its measured height is 0 there —
  // that's also how this naturally falls back to the lg viewport-calc height on smaller
  // desktop widths where the sidebar isn't shown at all).
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [sidebarHeight, setSidebarHeight] = useState(0);
  useEffect(() => {
    const node = sidebarRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setSidebarHeight(entry.contentRect.height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const chatListHook = useChatList(filterType, setFilterType, isSupport ? null : chatIdParam);
  const { chatList, markAsRead, appendNewChat, clearUnread, removeChat, fetchList } = chatListHook;

  // Resolve the active chat: prefer the loaded list row (has name/avatar/status), else fall
  // back to parsing the URL id so messages can still load before that row arrives.
  const activeListChat: ChatListItem | null = useMemo(() => {
    if (!chatIdParam || isSupport) return null;
    return chatList.find((chat) => chat.uniqueId === chatIdParam) ?? null;
  }, [chatIdParam, isSupport, chatList]);

  const activeChat = useMemo(() => {
    if (isSupport || !chatIdParam) return null;
    if (activeListChat) return { partner_id: activeListChat.partner_id, booking_id: activeListChat.booking_id };
    return parseChatUniqueId(chatIdParam);
  }, [isSupport, chatIdParam, activeListChat]);

  // Deep-links from provider/service pages carry the provider's name/image
  // as query params so the header (and the new list row) can show it before
  // the chat has any messages — new pre-booking chats aren't in the list yet.
  const fallbackName = typeof router.query.name === "string" ? router.query.name : undefined;
  const fallbackImage = typeof router.query.image === "string" ? router.query.image : undefined;
  const fallbackStatus = typeof router.query.status === "string" ? router.query.status : undefined;
  const fallbackTitle = typeof router.query.title === "string" ? router.query.title : undefined;
  const fallbackExtraCount = typeof router.query.extraCount === "string" ? Number(router.query.extraCount) : undefined;
  const fallbackDate = typeof router.query.date === "string" ? router.query.date : undefined;
  const fallbackTime = typeof router.query.time === "string" ? router.query.time : undefined;

  const {
    chatMessages,
    isLoading: isLoadingMessages,
    isSending,
    message,
    setMessage,
    attachedFiles,
    setAttachedFiles,
    blockedStatus,
    setBlockedStatus,
    handymanDetails,
    bookingSummary,
    fetchChatMessages,
    handleScroll,
    handleSend,
  } = useChatMessages({
    isAdmin: isSupport,
    activeChat,
    currentUserId: currentUser?.id,
    onNewChatContext: appendNewChat,
    scrollToBottom: scrollChatToBottom,
    fallbackName,
    fallbackImage,
  });

  // If a chat id in the URL belongs to the tab that isn't currently loaded, switch tabs and fetch it.
  // Deliberately excludes `filterType` from its deps (read via ref instead): a manual tab
  // switch changes filterType before router.push clears chatIdParam, and reacting to that
  // transient filterType change here would see the still-stale chatIdParam and flip the tab
  // straight back — the exact "old tab reopens" bug this effect must not cause.
  const filterTypeRef = useRef(filterType);
  useEffect(() => {
    filterTypeRef.current = filterType;
  }, [filterType]);

  // Same reasoning, same ref trick — `activeListChat` can't be a dep either.
  // handleTabChange's fetchList() replaces `chatList` synchronously, which
  // recomputes `activeListChat` to null (the still-stale chatIdParam from
  // the OLD tab isn't in the NEW tab's list) a render before router.push
  // actually clears chatIdParam. Depending on `activeListChat` re-fires this
  // effect on exactly that transient null, which then "corrects" the just-
  // picked new tab back to whatever the stale chatIdParam belongs to — the
  // same flicker this whole ref pattern exists to prevent, just reached via
  // activeListChat instead of filterType.
  const activeListChatRef = useRef(activeListChat);
  useEffect(() => {
    activeListChatRef.current = activeListChat;
  }, [activeListChat]);

  /* eslint-disable react-hooks/set-state-in-effect -- resolves which tab the deep-linked chat id belongs to */
  useEffect(() => {
    if (!chatIdParam || isSupport || activeListChatRef.current) return;
    const targetFilter: ChatListFilter = chatIdParam.endsWith("_pre") ? "pre_booking" : "booking";
    if (filterTypeRef.current !== targetFilter) {
      setFilterType(targetFilter);
      fetchList(0, targetFilter, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-evaluate on a real chatIdParam/isSupport change; filterType and activeListChat are read live via refs, see comments above
  }, [chatIdParam, isSupport]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Mark the just-opened conversation read and clear its local badge.
  useEffect(() => {
    if (isSupport) {
      markAsRead(null, true);
      return;
    }
    if (!activeChat) return;
    markAsRead(activeChat, false);
    if (activeListChat && Number(activeListChat.un_read_chats ?? 0) > 0) {
      clearUnread(activeListChat.uniqueId, activeListChat.booking_id ? "booking" : "pre_booking");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatIdParam, isSupport]);

  // Tell the global unread poll the support thread is open live, so a push/visibility
  // refresh while you're already reading it doesn't re-inflate the admin badge — and
  // clear the flag on switch/unmount so the poll resumes normal counting.
  useEffect(() => {
    dispatch(setSupportChatOpen(isSupport));
    return () => {
      dispatch(setSupportChatOpen(false));
    };
  }, [dispatch, isSupport]);

  const handleTabChange = (tab: ChatListFilter) => {
    if (tab === filterType) return;
    chatListHook.handleFilterChange(tab);
    router.push(`${localizePath("/chats", lang, defaultLocale)}?tab=${tab}`);
  };

  const handleSelectChat = (chat: ChatListItem) => {
    const type: ChatListFilter = chat.booking_id ? "booking" : "pre_booking";
    router.push(`${localizePath(`/chats/${chat.uniqueId}`, lang, defaultLocale)}?type=${type}`);
  };

  const handleBlock = useCallback(
    async (data: { reason_id: number | null; additional_info: string }) => {
      if (!activeChat) return;
      try {
        const response = await blockUserApi({
          partner_id: activeChat.partner_id,
          reason_id: data.reason_id ?? undefined,
          additional_info: data.additional_info,
        });
        if (response?.error === false) {
          setBlockedStatus({
            isBlocked: true,
            blockedByUser: true,
            blockedByProvider: false,
            message: t("chats.youHaveBlockedThisProvider"),
          });
          toast.success(t("chats.providerBlocked"));
        } else {
          toast.error(response?.message || t("chats.errorBlockingProvider"));
        }
      } catch {
        toast.error(t("chats.errorBlockingProvider"));
      }
    },
    [activeChat, setBlockedStatus, t]
  );

  const handleUnblock = useCallback(async () => {
    if (!activeChat) return;
    try {
      const response = await unblockUserApi({ partner_id: activeChat.partner_id });
      if (response?.error === false) {
        setBlockedStatus({ isBlocked: false, blockedByUser: false, blockedByProvider: false, message: "" });
        toast.success(t("chats.providerUnblocked"));
        fetchChatMessages(0, false);
      } else {
        toast.error(response?.message || t("chats.errorUnblockingProvider"));
      }
    } catch {
      toast.error(t("chats.errorUnblockingProvider"));
    }
  }, [activeChat, setBlockedStatus, fetchChatMessages, t]);

  const handleDelete = useCallback(async () => {
    if (!activeChat) return;
    try {
      const response = await deleteChatUserApi({
        partner_id: activeChat.partner_id,
        booking_id: activeChat.booking_id ?? undefined,
      });
      if (response?.error === false) {
        removeChat(activeChat.partner_id, activeChat.booking_id);
        toast.success(t("chats.messagesDeleted"));
        router.push(`${localizePath("/chats", lang, defaultLocale)}?tab=${filterType}`);
      } else {
        toast.error(response?.message || t("chats.errorDeletingMessages"));
      }
    } catch {
      toast.error(t("chats.errorDeletingMessages"));
    }
  }, [activeChat, removeChat, router, lang, defaultLocale, filterType, t]);

  const conversation: ChatDetailConversation | null = isSupport
    ? { partnerId: 0, bookingId: null, name: t("chats.customerSupport"), avatar: "" }
    : activeChat
      ? {
          partnerId: activeChat.partner_id,
          bookingId: activeChat.booking_id,
          name: activeListChat
            ? activeListChat.translated_partner_name || activeListChat.partner_name
            : (fallbackName ?? t("chats.chat")),
          avatar: activeListChat?.image ?? fallbackImage ?? "",
          // Prefer the list row's order_status: it's what the list itself renders (so this
          // stays consistent with what the user just clicked), and its vocabulary is known to
          // match toBookingStatusKey. bookingSummary.orderStatus comes from a different
          // endpoint (getChatHistoryApi's booking_status) whose raw strings don't always match
          // that same map — when they don't, toBookingStatusKey returns null and the header
          // wrongly falls back to "Pre-Booking Enquiry" even for a real, resolved booking chat.
          orderStatus: activeListChat?.order_status ?? bookingSummary?.orderStatus ?? fallbackStatus,
          serviceTitle: bookingSummary?.serviceTitle ?? fallbackTitle,
          extraServicesCount: bookingSummary?.extraServicesCount ?? fallbackExtraCount,
          dateOfService: bookingSummary?.dateOfService ?? fallbackDate,
          startingTime: bookingSummary?.startingTime ?? fallbackTime,
        }
      : null;

  const handleMobileBack = () =>
    router.push(`${localizePath("/chats", lang, defaultLocale)}?tab=${filterType}`);

  return (
    <>
      <PageBreadcrumb
        title={title}
        items={[{ label: title }]}
        hideMobileBar
        hideMobileDivider
      />

      {/* Mobile: list OR thread, full-screen takeover (escapes the page's header/footer/bottom-nav
       * flow entirely via fixed inset-0, same pattern as mobile-request-service-screen). The thread
       * sits above the bottom nav (z-60); the list sits below it (z-40) so the nav bar still shows. */}
      <div
        className={cn(
          "fixed inset-0 flex w-full flex-col bg-bg-secondary xl:hidden",
          chatIdParam ? "z-60" : "z-40"
        )}
      >
        <div className={cn("flex w-full flex-1 flex-col overflow-hidden", !chatIdParam && "pb-16")}>
        {chatIdParam ? (
          <ChatDetail
            key={chatIdParam}
            conversation={conversation}
            variant={isSupport ? "support" : "default"}
            chatMessages={chatMessages}
            isLoadingMessages={isLoadingMessages}
            onScroll={handleScroll}
            currentUserId={currentUser?.id}
            currentUserImage={currentUser?.image}
            message={message}
            onMessageChange={setMessage}
            attachedFiles={attachedFiles}
            onAttachedFilesChange={setAttachedFiles}
            onSend={handleSend}
            isSending={isSending}
            blockedStatus={blockedStatus}
            handyman={handymanDetails}
            onBlock={handleBlock}
            onUnblock={handleUnblock}
            onDelete={handleDelete}
            onBack={handleMobileBack}
          />
        ) : (
          <ChatList
            tab={filterType}
            onTabChange={handleTabChange}
            conversations={chatList}
            selectedChatId={chatIdParam ?? null}
            onSelectChat={handleSelectChat}
            isLoading={chatListHook.isInitialLoading}
            isLoadingMore={chatListHook.isLoadingMore}
            onScroll={chatListHook.handleScroll}
            tabTotals={chatListHook.tabTotals}
            allowPreBookingChat
            allowPostBookingChat
            onOpenBlockedProviders={() => setBlockedProvidersOpen(true)}
          />
        )}
        </div>
      </div>

      {/* Desktop: list + thread side by side.
       *
       * Below xl (no sidebar column) the panel is bounded to the layout's own vertical
       * space: <main> carries a site-wide min-h-screen measured from main's OWN top (not
       * the viewport's), and since main starts ~186px down the page, that guarantee ends
       * 186px past the raw viewport fold. `100vh - 111px` (111 = 297px above the panel
       * from the true page top, minus that 186px) targets main's real bottom, so the panel
       * fills the space this layout already reserves and only its own internal areas
       * (message list, card list) scroll.
       *
       * At xl+ the sidebar sits beside the panel and must never be exceeded — the panel
       * switches to an inline height matching the sidebar's own measured height
       * (sidebarHeight, via ResizeObserver; see above) instead. Pure CSS align-items:stretch
       * can't do this: it only grows a shorter sibling to match a taller one, never shrinks
       * a taller one down, and the message list's content is often much taller than the
       * sidebar's fixed nav — that's what let the panel grow unbounded and the whole page
       * scroll before this was measured directly.
       *
       * The account sidebar (w-96) + chat list (w-96) together already eat 792px, leaving
       * only ~230px for the actual conversation at the 1024px "laptop" breakpoint — the
       * header name/id and the service-details row were truncating/wrapping badly. Hide the
       * sidebar at lg and bring it back at xl, where there's enough room for all three
       * columns. */}
      <div className="container hidden flex-col items-start gap-6 py-8 xl:flex xl:flex-row xl:justify-center">
        <div ref={sidebarRef} className="hidden xl:block xl:w-96 xl:shrink-0 xl:overflow-y-auto xl:self-start">
          <AccountSidebar />
        </div>
        <div
          className="flex h-[calc(100vh-111px)] min-h-[520px] min-w-0 flex-1 items-start rounded-xl border border-border-default bg-bg-primary"
          style={sidebarHeight > 0 ? { height: sidebarHeight } : undefined}
        >
          {!isSupport && (
            <ChatList
              tab={filterType}
              onTabChange={handleTabChange}
              conversations={chatList}
              selectedChatId={chatIdParam ?? null}
              onSelectChat={handleSelectChat}
              isLoading={chatListHook.isInitialLoading}
              isLoadingMore={chatListHook.isLoadingMore}
              onScroll={chatListHook.handleScroll}
              listRef={chatListHook.listContainerRef}
              tabTotals={chatListHook.tabTotals}
              allowPreBookingChat
              allowPostBookingChat
              onOpenBlockedProviders={() => setBlockedProvidersOpen(true)}
            />
          )}
          <ChatDetail
            key={chatIdParam ?? "empty"}
            conversation={conversation}
            isListEmpty={!isSupport && !chatListHook.isInitialLoading && chatList.length === 0}
            activeTab={filterType}
            variant={isSupport ? "support" : "default"}
            chatMessages={chatMessages}
            isLoadingMessages={isLoadingMessages}
            onScroll={handleScroll}
            currentUserId={currentUser?.id}
            currentUserImage={currentUser?.image}
            message={message}
            onMessageChange={setMessage}
            attachedFiles={attachedFiles}
            onAttachedFilesChange={setAttachedFiles}
            onSend={handleSend}
            isSending={isSending}
            blockedStatus={blockedStatus}
            handyman={handymanDetails}
            onBlock={handleBlock}
            onUnblock={handleUnblock}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <BlockedProvidersModal
        open={blockedProvidersOpen}
        onOpenChange={setBlockedProvidersOpen}
        onProviderUnblocked={(providerId) => {
          if (activeChat?.partner_id === providerId) {
            setBlockedStatus({ isBlocked: false, blockedByUser: false, blockedByProvider: false, message: "" });
            fetchChatMessages(0, false);
          }
        }}
      />
    </>
  );
}
