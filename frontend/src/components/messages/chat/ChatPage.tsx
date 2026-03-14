import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import useService from "../../../hooks/use-service";
import MessagesService from "../../../services/auth-aware/MessagesService";
import { useAppDispatcher, useAppSelector } from "../../../redux/hooks";
import { setMessagesForConversation, upsertMessage } from "../../../redux/messages-slice";
import useUserId from "../../../hooks/use-user-id";
import "./ChatPage.css";

export default function ChatPage() {
    // Route supports both existing conversations (/messages/:conversationId)
    // and starting a new one from profile/follows (/messages/new/:userId).
    const { conversationId, userId } = useParams<"conversationId" | "userId">();
    const currentUserId = useUserId();
    const messagesService = useService(MessagesService);
    const dispatch = useAppDispatcher();
    const conversations = useAppSelector(state => state.messagesSlice.conversations);
    const messagesByConversationId = useAppSelector(state => state.messagesSlice.messagesByConversationId);
    const [resolvedConversationId, setResolvedConversationId] = useState<string>(conversationId ?? "");
    const [content, setContent] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const isMarkingReadRef = useRef<boolean>(false);
    const lastAutoMarkKeyRef = useRef<string>("");

    const messages = useMemo(
        () => messagesByConversationId[resolvedConversationId] ?? [],
        [messagesByConversationId, resolvedConversationId]
    );
    const activeConversation = conversations.find(c => c.id === resolvedConversationId);

    useEffect(() => {
        (async () => {
            try {
                setIsLoading(true);
                if (conversationId) {
                    const response = await messagesService.getConversationMessages(conversationId);
                    setResolvedConversationId(conversationId);
                    dispatch(setMessagesForConversation({ conversationId, messages: response.messages }));
                    await messagesService.markConversationAsRead(conversationId);
                }
            } catch (e) {
                alert(e);
            } finally {
                setIsLoading(false);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId, dispatch]);

    useEffect(() => {
        if (!resolvedConversationId || !currentUserId) {
            return;
        }

        const unreadIncomingMessageIds = messages
            .filter(message => message.senderId !== currentUserId && !message.readAt)
            .map(message => message.id)
            .sort();

        if (unreadIncomingMessageIds.length === 0) {
            lastAutoMarkKeyRef.current = "";
            return;
        }

        const nextMarkKey = `${resolvedConversationId}:${unreadIncomingMessageIds.join("|")}`;
        if (isMarkingReadRef.current || lastAutoMarkKeyRef.current === nextMarkKey) {
            return;
        }

        lastAutoMarkKeyRef.current = nextMarkKey;
        isMarkingReadRef.current = true;

        (async () => {
            try {
                await messagesService.markConversationAsRead(resolvedConversationId);
            } finally {
                isMarkingReadRef.current = false;
            }
        })();
    }, [messages, resolvedConversationId, currentUserId, messagesService]);

    async function sendMessage() {
        const targetUserId = userId || activeConversation?.otherUser?.id;
        if (!content.trim() || !targetUserId) return;
        try {
            const response = await messagesService.sendMessageToUser(targetUserId, content.trim());
            const nextConversationId = response.conversation.id;
            setResolvedConversationId(nextConversationId);
            dispatch(upsertMessage(response.message));
            setContent("");
        } catch (e) {
            alert(e);
        }
    }

    if (isLoading) return <div>Loading chat...</div>;

    return (
        <div className="ChatPage">
            <h2 className="ChatHeader">Chat {activeConversation?.otherUser?.name ? `with ${activeConversation.otherUser.name}` : ""}</h2>
            <div className="ChatMessages">
                {messages.map(message => (
                    <div
                        key={message.id}
                        className={`ChatMessageRow ${message.senderId === currentUserId ? "ChatMessageRowSent" : "ChatMessageRowReceived"}`}
                    >
                        <div className={`ChatBubble ${message.senderId === currentUserId ? "ChatBubbleSent" : "ChatBubbleReceived"}`}>
                            {message.content}
                        </div>
                    </div>
                ))}
            </div>
            <div className="ChatInputBar">
                <input
                    className="ChatInput"
                    value={content}
                    onChange={event => setContent(event.target.value)}
                    placeholder="Type a message"
                />
                <button className="ChatSendButton" onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}
