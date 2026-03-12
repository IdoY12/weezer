import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useService from "../../../hooks/use-service";
import type Conversation from "../../../models/conversation";
import MessagesService from "../../../services/auth-aware/MessagesService";
import { useAppDispatcher, useAppSelector } from "../../../redux/hooks";
import { setConversations } from "../../../redux/messages-slice";
import ProfilePicture from "../../common/profile-picture/ProfilePicture";
import "./MessagesInbox.css";

export default function MessagesInbox() {
    const messagesService = useService(MessagesService);
    const navigate = useNavigate();
    const dispatch = useAppDispatcher();
    const conversations = useAppSelector(state => state.messagesSlice.conversations);
    const [isLoading, setIsLoading] = useState<boolean>(conversations.length === 0);

    useEffect(() => {
        (async () => {
            try {
                setIsLoading(true);
                const list = await messagesService.getConversations();
                dispatch(setConversations(list));
            } catch (e) {
                alert(e);
            } finally {
                setIsLoading(false);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    function openConversation(conversation: Conversation) {
        navigate(`/messages/${conversation.id}`);
    }

    if (isLoading) return <div>Loading conversations...</div>;

    return (
        <div className="MessagesInbox">
            <h2 className="MessagesInboxHeader">Messages</h2>
            {conversations.length === 0 && <p className="MessagesInboxEmpty">No conversations yet.</p>}
            {conversations.map(conversation => (
                <button
                    className="ConversationRow"
                    key={conversation.id}
                    onClick={() => openConversation(conversation)}
                >
                    <ProfilePicture user={conversation.otherUser ?? { id: "unknown", name: "Unknown User", username: "unknown", isPay: false }} className="ConversationAvatar" />
                    <div className="ConversationContent">
                        <div className="ConversationTopLine">
                            <span className={`ConversationName ${conversation.unreadCount > 0 ? "ConversationNameUnread" : ""}`}>
                                {conversation.otherUser?.name ?? "Unknown User"}
                            </span>
                            {conversation.lastMessage?.createdAt && (
                                <span className="ConversationTime">
                                    {new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            )}
                            {conversation.unreadCount > 0 && <span className="UnreadDot" />}
                        </div>
                        <div className="ConversationPreview">{conversation.lastMessage?.content ?? "No messages yet"}</div>
                    </div>
                </button>
            ))}
        </div>
    );
}
