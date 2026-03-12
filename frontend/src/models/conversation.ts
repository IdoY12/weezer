import type Message from "./message";
import type User from "./user";

export default interface Conversation {
    id: string
    participantOneId: string
    participantTwoId: string
    createdAt: string
    updatedAt: string
    otherUser: User | null
    lastMessage: Message | null
    unreadCount: number
}
