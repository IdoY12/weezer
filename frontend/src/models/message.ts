import type User from "./user";

export default interface Message {
    id: string
    conversationId: string
    senderId: string
    content: string
    readAt: string | null
    createdAt: string
    user: User
}
