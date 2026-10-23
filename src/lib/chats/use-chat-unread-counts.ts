"use client";

import { useCallback, useEffect, useRef } from "react";
import { getChatProviderListApi, getUserInfoApi } from "@/api/apiRoutes";
import { setUnreadCounts } from "@/store/slices/chat-ui-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { onFcmMessage } from "@/lib/firebase";

// This is a safety-net fallback only — FCM push and the visibility listener
// below catch the actual "something changed" moments instantly. A long
// interval here just bounds worst-case staleness (e.g. push silently failed
// to subscribe) without hammering the API on every tick.
const POLL_INTERVAL_MS = 60000;

interface ChatProviderListResponse {
  total_unread_users?: number;
}

interface UserInfoResponse {
  data?: { unread_chats_count?: number };
}

/** Global chat-unread poll — mount exactly once (in AppBootstrap), not per
 * consumer. Seeds chatUI.unreadCounts in Redux so every badge (account
 * sidebar, profile menu dropdown, anywhere else) just reads from there
 * instead of each polling the API independently.
 *
 * While the chat page itself is open, its own live state (tabTotals from
 * useChatList, and the immediate zero-out on marking a chat read) is more
 * precise and syncs straight to this same Redux slice — this poll is the
 * fallback for everywhere else, and for catching messages that arrived
 * while the user wasn't on the chat page at all. */
export function useChatUnreadCounts() {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector((state) => Boolean(state.auth.token));
  const isSupportChatOpen = useAppSelector((state) => state.chatUI.isSupportChatOpen);
  const isSupportChatOpenRef = useRef(isSupportChatOpen);
  useEffect(() => {
    isSupportChatOpenRef.current = isSupportChatOpen;
  }, [isSupportChatOpen]);

  const refresh = useCallback(async () => {
    if (!isLoggedIn) return;

    const [preBooking, booking, userInfo] = await Promise.all([
      getChatProviderListApi({ limit: 1, offset: 0, filter_type: "pre_booking" }) as Promise<
        ChatProviderListResponse | null
      >,
      getChatProviderListApi({ limit: 1, offset: 0, filter_type: "booking" }) as Promise<
        ChatProviderListResponse | null
      >,
      getUserInfoApi() as Promise<UserInfoResponse | null>,
    ]).catch(() => [null, null, null] as const);

    dispatch(
      setUnreadCounts({
        pre_booking: preBooking?.total_unread_users ?? 0,
        booking: booking?.total_unread_users ?? 0,
        // Support thread being actively read live — don't let a stale server count
        // re-inflate its badge until the user actually leaves it.
        admin: isSupportChatOpenRef.current ? 0 : (userInfo?.data?.unread_chats_count ?? 0),
      })
    );
  }, [isLoggedIn, dispatch]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  // A foreground push (tab open/focused) never reaches the service worker —
  // Firebase hands it to onMessage here instead. Any push means "something
  // changed", so just re-run the same refresh rather than parsing payload
  // shape, giving an instant badge update instead of waiting on the poll.
  useEffect(() => {
    if (!isLoggedIn) return;
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;
    onFcmMessage(refresh).then((unsub) => {
      if (cancelled) unsub?.();
      else unsubscribe = unsub;
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [isLoggedIn, refresh]);

  // The foreground push listener only catches messages that arrive while
  // this tab is the active one — a message that arrives while the user is
  // on another tab (or the browser/OS is backgrounded) is silently missed
  // until the next poll, which read as "stuck until I reload". Refetch the
  // moment the tab becomes visible again to close that gap. (visibilitychange
  // alone is enough — it already fires on tab-switch-back and window
  // restore; pairing it with a `focus` listener too just double-fires the
  // same refresh on every switch.)
  useEffect(() => {
    if (!isLoggedIn) return;
    const handleVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", handleVisible);
    return () => document.removeEventListener("visibilitychange", handleVisible);
  }, [isLoggedIn, refresh]);
}
