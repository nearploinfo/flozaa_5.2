"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getChatProviderListApi, markMessageAsReadApi } from "@/api/apiRoutes";
import { getChatUniqueId, type ChatListItemApi } from "@/lib/chats/chat-types";
import { setUnreadCounts } from "@/store/slices/chat-ui-slice";
import { useAppDispatch } from "@/store/hooks";

const LIST_LIMIT = 10;

export type ChatListFilter = "pre_booking" | "booking";

export interface ChatListItem extends ChatListItemApi {
  uniqueId: string;
}

/** Owns the chat list panel: fetching, filtering, pagination, tab unread totals, and markAsRead. */
export function useChatList(
  filterType: ChatListFilter,
  setFilterType: (filter: ChatListFilter) => void,
  activeUniqueId?: string | null
) {
  const dispatch = useAppDispatch();
  const [chatList, setChatList] = useState<ChatListItem[]>([]);
  const [listOffset, setListOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreChats, setHasMoreChats] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [tabTotals, setTabTotals] = useState<Record<ChatListFilter, number>>({ pre_booking: 0, booking: 0 });

  // Whatever chat is open right now is being read live (its own message poll keeps it
  // current) — never let the list poll re-inflate its badge/total from a stale server
  // un_read_chats count between the moment a message arrives and the next markAsRead.
  const activeUniqueIdRef = useRef(activeUniqueId);
  useEffect(() => {
    activeUniqueIdRef.current = activeUniqueId;
  }, [activeUniqueId]);

  // Mirrors ChatPage's own tabTotals into the global badge store live, so
  // the sidebar/profile-menu badges stay in sync with whatever's precisely
  // known here — no need to wait for the fallback poll.
  useEffect(() => {
    dispatch(setUnreadCounts(tabTotals));
  }, [dispatch, tabTotals]);

  const hasMoreChatsRef = useRef(hasMoreChats);
  const isLoadingMoreRef = useRef(isLoadingMore);
  useEffect(() => {
    hasMoreChatsRef.current = hasMoreChats;
    isLoadingMoreRef.current = isLoadingMore;
  }, [hasMoreChats, isLoadingMore]);

  // Tall desktop viewports can fit a full LIST_LIMIT page without the container ever
  // overflowing — no scrollbar means handleScroll's onScroll never fires, so pagination
  // would silently stop at page 1. Keep filling pages until the list actually overflows
  // (or runs out) so scroll-to-load has something to scroll in the first place.
  const listContainerRef = useRef<HTMLDivElement>(null);

  const markAsRead = useCallback((chat: { partner_id: number; booking_id: number | null } | null, admin: boolean) => {
    if (!chat && !admin) return;
    const params: Record<string, string | number> = admin
      ? { type: "0" }
      : chat?.booking_id
        ? { type: "1", booking_id: chat.booking_id }
        : chat?.partner_id
          ? { type: "1", provider_id: chat.partner_id }
          : { type: "1" };
    markMessageAsReadApi(params).catch(() => {});
    if (admin) dispatch(setUnreadCounts({ admin: 0 }));
  }, [dispatch]);

  const fetchOtherTabUnreadCount = useCallback(async (activeFilter: ChatListFilter) => {
    const otherFilter: ChatListFilter = activeFilter === "pre_booking" ? "booking" : "pre_booking";
    try {
      const response = await getChatProviderListApi({ limit: 1, offset: 0, filter_type: otherFilter });
      if (response?.total_unread_users !== undefined) {
        setTabTotals((prev) => ({ ...prev, [otherFilter]: response.total_unread_users }));
      }
    } catch {
      // best-effort badge count, ignore failures
    }
  }, []);

  /** Zeroes the currently-open chat's un_read_chats in a freshly-fetched list, and drops its
   * count out of the tab total — that chat is being read live, not sitting unread. */
  const excludeActiveChat = useCallback((list: ChatListItemApi[], total: number | undefined) => {
    const activeId = activeUniqueIdRef.current;
    if (!activeId) return { list, total };
    const activeChat = list.find((chat) => getChatUniqueId(chat) === activeId);
    const activeUnread = Number(activeChat?.un_read_chats ?? 0);
    if (activeUnread <= 0) return { list, total };
    return {
      list: list.map((chat) => (getChatUniqueId(chat) === activeId ? { ...chat, un_read_chats: 0 } : chat)),
      total: total !== undefined ? Math.max(0, total - activeUnread) : total,
    };
  }, []);

  const fetchList = useCallback(
    async (offset = 0, filter: ChatListFilter = filterType, isFilterChange = false) => {
      if (!isFilterChange && (!hasMoreChatsRef.current || isLoadingMoreRef.current)) return;

      setIsLoadingMore(true);
      setIsInitialLoading(offset === 0);

      try {
        const response = await getChatProviderListApi({ limit: LIST_LIMIT, offset, filter_type: filter });
        const rawList: ChatListItemApi[] = Array.isArray(response?.data) ? response.data : [];
        const { list, total } = excludeActiveChat(rawList, response?.total_unread_users);

        if (total !== undefined) {
          setTabTotals((prev) => ({ ...prev, [filter]: total }));
        }

        const listWithIds: ChatListItem[] = list.map((chat) => ({ ...chat, uniqueId: getChatUniqueId(chat) }));

        setChatList((prev) => {
          if (offset === 0) return listWithIds;
          const seen = new Set(prev.map((chat) => chat.uniqueId));
          return [...prev, ...listWithIds.filter((chat) => !seen.has(chat.uniqueId))];
        });
        setListOffset(offset + list.length);
        setHasMoreChats(list.length === LIST_LIMIT);
      } catch {
        // keep whatever was already loaded
      } finally {
        setIsLoadingMore(false);
        setIsInitialLoading(false);
      }
    },
    [filterType, excludeActiveChat]
  );

  useEffect(() => {
    if (isInitialLoading || isLoadingMore || !hasMoreChats) return;
    const node = listContainerRef.current;
    if (!node || node.scrollHeight > node.clientHeight) return;
    fetchList(listOffset, filterType, false);
  }, [chatList, isInitialLoading, isLoadingMore, hasMoreChats, listOffset, filterType, fetchList]);

  /** Silent background refresh (no loading state) — polls the current tab's first page so
   * incoming messages on chats you aren't actively viewing still show up as an unread badge
   * on the card and bump the tab total, without a websocket/push feed. */
  const refreshUnread = useCallback(async (filter: ChatListFilter) => {
    if (isLoadingMoreRef.current) return;
    try {
      const response = await getChatProviderListApi({ limit: LIST_LIMIT, offset: 0, filter_type: filter });
      const rawList: ChatListItemApi[] = Array.isArray(response?.data) ? response.data : [];
      const { list, total } = excludeActiveChat(rawList, response?.total_unread_users);
      if (total !== undefined) {
        setTabTotals((prev) => ({ ...prev, [filter]: total }));
      }
      const listWithIds: ChatListItem[] = list.map((chat) => ({ ...chat, uniqueId: getChatUniqueId(chat) }));
      setChatList((prev) => {
        const freshIds = new Set(listWithIds.map((chat) => chat.uniqueId));
        const rest = prev.filter((chat) => !freshIds.has(chat.uniqueId));
        return [...listWithIds, ...rest];
      });
    } catch {
      // best-effort badge refresh, ignore failures
    }
  }, [excludeActiveChat]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshUnread(filterType);
      fetchOtherTabUnreadCount(filterType);
    }, 8000);
    return () => clearInterval(interval);
  }, [filterType, refreshUnread, fetchOtherTabUnreadCount]);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
      if (scrollHeight - scrollTop <= clientHeight * 1.5 && !isLoadingMoreRef.current && hasMoreChatsRef.current) {
        fetchList(listOffset, filterType, false);
      }
    },
    [fetchList, listOffset, filterType]
  );

  const handleFilterChange = useCallback(
    (newFilter: ChatListFilter) => {
      setListOffset(0);
      setHasMoreChats(true);
      setFilterType(newFilter);
      fetchList(0, newFilter, true);
      fetchOtherTabUnreadCount(newFilter);
    },
    [setFilterType, fetchList, fetchOtherTabUnreadCount]
  );

  // Initial mount fetch — filterType here reflects whatever chats-view seeded from the URL.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the initial fetch, mirrors payment-history-view's page-fetch effect
    fetchList(0, filterType, true);
    fetchOtherTabUnreadCount(filterType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Inserts/updates a conversation row after a first message creates a brand-new chat context.
   * Callers (e.g. handleSend) often don't have the provider's name/image on hand and pass "" for
   * them — merge onto the existing row instead of overwriting so those blanks don't clobber the
   * real values already loaded from the list API. */
  const appendNewChat = useCallback((newChat: ChatListItemApi) => {
    const uniqueId = getChatUniqueId(newChat);
    const chatWithUniqueId: ChatListItem = { ...newChat, uniqueId };
    let stored = chatWithUniqueId;
    setChatList((prev) => {
      const existingIndex = prev.findIndex((chat) => chat.uniqueId === uniqueId);
      if (existingIndex !== -1) {
        const existing = prev[existingIndex];
        const merged: ChatListItem = {
          ...existing,
          ...chatWithUniqueId,
          partner_name: chatWithUniqueId.partner_name || existing.partner_name,
          translated_partner_name: chatWithUniqueId.translated_partner_name || existing.translated_partner_name,
          image: chatWithUniqueId.image || existing.image,
        };
        stored = merged;
        const updated = [...prev];
        updated[existingIndex] = merged;
        return updated;
      }
      return [chatWithUniqueId, ...prev];
    });
    return stored;
  }, []);

  const clearUnread = useCallback((uniqueId: string, filter: ChatListFilter) => {
    setChatList((prev) => prev.map((chat) => (chat.uniqueId === uniqueId ? { ...chat, un_read_chats: 0 } : chat)));
    setTabTotals((prev) => ({ ...prev, [filter]: Math.max(0, (prev[filter] || 0) - 1) }));
  }, []);

  const removeChat = useCallback((partnerId: number, bookingId: number | null) => {
    setChatList((prev) =>
      prev.filter((chat) => !(chat.partner_id === partnerId && chat.booking_id === bookingId))
    );
  }, []);

  return {
    chatList,
    setChatList,
    listContainerRef,
    listOffset,
    isLoadingMore,
    hasMoreChats,
    isInitialLoading,
    tabTotals,
    fetchList,
    fetchOtherTabUnreadCount,
    handleScroll,
    handleFilterChange,
    markAsRead,
    appendNewChat,
    clearUnread,
    removeChat,
  };
}
