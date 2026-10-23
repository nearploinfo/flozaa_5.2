import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface ChatUnreadCounts {
  pre_booking: number;
  booking: number;
  admin: number;
}

interface ChatUIState {
  unreadCounts: ChatUnreadCounts;
  // Whether the support/admin thread is the one currently open on the chats page —
  // the global unread poll uses this to keep dispatching admin:0 while it's open,
  // since that thread is being read live and has no per-message breakdown to exclude.
  isSupportChatOpen: boolean;
}

const initialState: ChatUIState = {
  unreadCounts: { pre_booking: 0, booking: 0, admin: 0 },
  isSupportChatOpen: false,
};

export const chatUISlice = createSlice({
  name: "chatUI",
  initialState,
  reducers: {
    // Partial — callers only pass the keys they actually know just changed
    // (e.g. the chat page syncing its own tabTotals, or the global poll
    // seeding all three at once).
    setUnreadCounts: (state, action: PayloadAction<Partial<ChatUnreadCounts>>) => {
      Object.assign(state.unreadCounts, action.payload);
    },
    setSupportChatOpen: (state, action: PayloadAction<boolean>) => {
      state.isSupportChatOpen = action.payload;
    },
  },
});

export const { setUnreadCounts, setSupportChatOpen } = chatUISlice.actions;
export default chatUISlice.reducer;
