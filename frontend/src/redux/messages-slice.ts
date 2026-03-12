import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type Conversation from "../models/conversation";
import type Message from "../models/message";

interface MessagesState {
    conversations: Conversation[]
    messagesByConversationId: Record<string, Message[]>
    unreadCount: number
}

const initialState: MessagesState = {
    conversations: [],
    messagesByConversationId: {},
    unreadCount: 0
};

function calculateUnreadCount(conversations: Conversation[]) {
    return conversations.reduce((sum, conversation) => sum + (conversation.unreadCount ?? 0), 0);
}

export const messagesSlice = createSlice({
    name: "messages",
    initialState,
    reducers: {
        setConversations: (state, action: PayloadAction<Conversation[]>) => {
            state.conversations = action.payload;
            state.unreadCount = calculateUnreadCount(action.payload);
        },
        setMessagesForConversation: (state, action: PayloadAction<{ conversationId: string, messages: Message[] }>) => {
            state.messagesByConversationId[action.payload.conversationId] = action.payload.messages;
        },
        upsertMessage: (state, action: PayloadAction<Message>) => {
            const message = action.payload;
            const list = state.messagesByConversationId[message.conversationId] ?? [];
            if (!list.find(existing => existing.id === message.id)) {
                state.messagesByConversationId[message.conversationId] = [...list, message];
            }
        },
        setUnreadCount: (state, action: PayloadAction<number>) => {
            state.unreadCount = action.payload;
        }
    }
});

export const { setConversations, setMessagesForConversation, upsertMessage, setUnreadCount } = messagesSlice.actions;
export default messagesSlice.reducer;
