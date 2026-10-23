"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getChatHistoryApi, sendChatMessageApi } from "@/api/apiRoutes";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { ChatListItemApi, ChatMessageApi } from "@/lib/chats/chat-types";

const MSG_LIMIT = 15;
const POLL_INTERVAL_MS = 5000;

export interface BlockedStatus {
  isBlocked: boolean;
  blockedByUser: boolean;
  blockedByProvider: boolean;
  message: string;
}

const IDLE_BLOCKED_STATUS: BlockedStatus = {
  isBlocked: false,
  blockedByUser: false,
  blockedByProvider: false,
  message: "",
};

export interface ChatBookingSummary {
  serviceTitle: string;
  extraServicesCount: number;
  dateOfService?: string;
  startingTime?: string;
  orderStatus?: string;
}

type ActiveChat = { partner_id: number; booking_id: number | null } | null;

function messageKey(message: ChatMessageApi): string {
  if (message.id != null) return String(message.id);
  return `${message.sender_id}-${message.created_at}-${message.message}`;
}

/** Owns message-level state: fetching, pagination, sending, blocking, and a light poll for incoming messages. */
export function useChatMessages({
  isAdmin,
  activeChat,
  currentUserId,
  onNewChatContext,
  scrollToBottom,
  fallbackName,
  fallbackImage,
}: {
  isAdmin: boolean;
  activeChat: ActiveChat;
  currentUserId: number | string | undefined;
  onNewChatContext?: (chat: ChatListItemApi) => void;
  scrollToBottom: () => void;
  /** Provider name/image carried via deep-link query params — used to seed the list row when this chat has no messages yet. */
  fallbackName?: string;
  fallbackImage?: string;
}) {
  const { t } = useTranslation();

  const [chatMessages, setChatMessages] = useState<ChatMessageApi[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [message, setMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const [blockedStatus, setBlockedStatus] = useState<BlockedStatus>(IDLE_BLOCKED_STATUS);
  const [handymanDetails, setHandymanDetails] = useState<{ id: number; name: string; image?: string } | null>(null);
  // get_chat_history already returns the booking's services/date/time/status
  // on every fetch — no need for a separate booking-details call just to
  // show the service-details row under the chat header.
  const [bookingSummary, setBookingSummary] = useState<ChatBookingSummary | null>(null);

  const isLoadingRef = useRef(false);
  const contextKeyRef = useRef<string | null>(null);
  const isSendingRef = useRef(false);
  useEffect(() => {
    isSendingRef.current = isSending;
  }, [isSending]);

  const contextKey = isAdmin ? "admin" : activeChat ? `provider-${activeChat.partner_id}-${activeChat.booking_id ?? "pre"}` : null;

  const fetchChatMessages = useCallback(
    async (newOffset = 0, append = false) => {
      if (isLoadingRef.current && !append) return;
      if (!contextKey) return;

      if (!append) setChatMessages([]);
      isLoadingRef.current = true;
      setIsLoading(true);

      try {
        const payload: Record<string, string | number> = { limit: MSG_LIMIT, offset: newOffset };
        if (isAdmin) {
          payload.type = "0";
          setHandymanDetails(null);
        } else if (activeChat) {
          payload.type = "1";
          payload.provider_id = activeChat.partner_id;
          if (activeChat.booking_id) payload.booking_id = activeChat.booking_id;
        } else {
          return;
        }

        const response = await getChatHistoryApi(payload);
        if (contextKeyRef.current !== contextKey) return; // stale response from a since-abandoned chat switch

        if (!isAdmin && response) {
          const blocked = response.is_blocked === 1;
          const blockedByUser = response.is_block_by_user === 1;
          const blockedByProvider = response.is_block_by_provider === 1;
          setBlockedStatus({
            isBlocked: blocked,
            blockedByUser,
            blockedByProvider,
            message: blockedByUser
              ? t("chats.youHaveBlockedThisProvider")
              : blockedByProvider
                ? t("chats.providerHasBlockedYou")
                : "",
          });
          setHandymanDetails(response.handyman_details ?? null);

          const services = Array.isArray(response.services) ? response.services : [];
          setBookingSummary(
            services.length > 0
              ? {
                  serviceTitle: services[0]?.service_name ?? "",
                  extraServicesCount: Math.max(0, services.length - 1),
                  dateOfService: response.booking_start_date,
                  startingTime: response.booking_start_time,
                  orderStatus: response.booking_status,
                }
              : null
          );
        } else if (isAdmin) {
          setBlockedStatus(IDLE_BLOCKED_STATUS);
          setBookingSummary(null);
        }

        const messages: ChatMessageApi[] = Array.isArray(response?.data) ? response.data : [];
        if (messages.length < MSG_LIMIT) setHasMore(false);

        if (append) {
          setChatMessages((prev) => {
            const seen = new Set(prev.map(messageKey));
            return [...prev, ...messages.filter((msg) => !seen.has(messageKey(msg)))];
          });
        } else {
          setChatMessages(messages);
          setTimeout(scrollToBottom, 50);
        }
        setOffset(newOffset);
      } catch {
        if (!append) {
          setChatMessages([]);
          toast.error(t("chats.errorFetchingMessages"));
        }
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [contextKey, isAdmin, activeChat, scrollToBottom, t]
  );

  // Context-change effect: reset + fetch whenever the open thread changes.
  /* eslint-disable react-hooks/set-state-in-effect -- resets/refetches the pane's state for the newly-opened thread */
  useEffect(() => {
    if (!contextKey) {
      setChatMessages([]);
      contextKeyRef.current = null;
      return;
    }
    if (contextKeyRef.current === contextKey) return;
    contextKeyRef.current = contextKey;
    setOffset(0);
    setHasMore(true);
    fetchChatMessages(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Poll the open thread for new messages — stand-in for a live push feed.
  useEffect(() => {
    if (!contextKey) return;
    const interval = setInterval(() => {
      if (isSendingRef.current || isLoadingRef.current) return;
      const payload: Record<string, string | number> = { limit: MSG_LIMIT, offset: 0 };
      if (isAdmin) {
        payload.type = "0";
      } else if (activeChat) {
        payload.type = "1";
        payload.provider_id = activeChat.partner_id;
        if (activeChat.booking_id) payload.booking_id = activeChat.booking_id;
      } else {
        return;
      }
      getChatHistoryApi(payload)
        .then((response) => {
          if (contextKeyRef.current !== contextKey) return;
          const incoming: ChatMessageApi[] = Array.isArray(response?.data) ? response.data : [];
          if (incoming.length === 0) return;
          setChatMessages((prev) => {
            const seen = new Set(prev.map(messageKey));
            const fresh = incoming.filter((msg) => !seen.has(messageKey(msg)));
            if (fresh.length === 0) return prev;
            // The just-sent optimistic bubble has no id yet, so it never matches the server's
            // version by messageKey — drop it here once the real one with the same
            // sender+text shows up, or it'd sit next to its own duplicate forever.
            const freshContentKeys = new Set(fresh.map((msg) => `${msg.sender_id}|${msg.message}`));
            const withoutStaleOptimistic = prev.filter(
              (msg) => msg.id != null || !freshContentKeys.has(`${msg.sender_id}|${msg.message}`)
            );
            setTimeout(scrollToBottom, 50);
            return [...fresh, ...withoutStaleOptimistic];
          });
        })
        .catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [contextKey, isAdmin, activeChat, scrollToBottom]);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (event.currentTarget.scrollTop === 0 && !isLoadingRef.current && hasMore) {
        fetchChatMessages(offset + MSG_LIMIT, true);
      }
    },
    [fetchChatMessages, offset, hasMore]
  );

  const handleSend = useCallback(
    async (questionText?: string) => {
      const messageToSend = typeof questionText === "string" ? questionText : message;
      if (messageToSend.trim() === "" && attachedFiles.length === 0) return;

      setIsSending(true);

      const objectUrls: string[] = [];
      const optimisticMessage: ChatMessageApi = {
        message: messageToSend,
        file: attachedFiles.map((file) => {
          const url = URL.createObjectURL(file);
          objectUrls.push(url);
          return { file: url, file_name: file.name, file_type: file.type };
        }),
        sender_id: currentUserId ?? "",
        sender_details: currentUserId != null ? { id: currentUserId } : null,
        created_at: new Date().toISOString(),
      };

      try {
        const receiverId = isAdmin ? undefined : activeChat?.partner_id;
        const bookingId = isAdmin ? undefined : (activeChat?.booking_id ?? undefined);

        await sendChatMessageApi({
          receiver_id: receiverId,
          booking_id: bookingId,
          receiver_type: isAdmin ? 0 : 1,
          message: messageToSend,
          attachment: attachedFiles,
        });

        setChatMessages((prev) => [optimisticMessage, ...prev]);
        setMessage("");
        setAttachedFiles([]);
        objectUrls.forEach((url) => URL.revokeObjectURL(url));
        setTimeout(scrollToBottom, 50);

        if (!isAdmin && activeChat && onNewChatContext) {
          onNewChatContext({
            partner_id: activeChat.partner_id,
            booking_id: activeChat.booking_id,
            partner_name: fallbackName ?? "",
            image: fallbackImage ?? "",
            last_message: messageToSend,
            un_read_chats: 0,
          });
        }
      } catch {
        toast.error(t("chats.failedToSendMessage"));
      } finally {
        setIsSending(false);
      }
    },
    [
      message,
      attachedFiles,
      isAdmin,
      activeChat,
      currentUserId,
      onNewChatContext,
      scrollToBottom,
      fallbackName,
      fallbackImage,
      t,
    ]
  );

  return {
    chatMessages,
    setChatMessages,
    hasMore,
    isLoading,
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
  };
}
