import type Conversation from "../../models/conversation";
import type Message from "../../models/message";
import AuthAware from "./AuthAware";

export default class MessagesService extends AuthAware {
    async getConversations(): Promise<Conversation[]> {
        const { data } = await this.axiosInstance.get<Conversation[]>("/messages/conversations");
        return data;
    }

    async getConversationMessages(conversationId: string): Promise<{ conversation: Conversation, messages: Message[] }> {
        const { data } = await this.axiosInstance.get<{ conversation: Conversation, messages: Message[] }>(`/messages/conversations/${conversationId}`);
        return data;
    }

    async sendMessageToUser(userId: string, content: string): Promise<{ conversation: Conversation, message: Message }> {
        const { data } = await this.axiosInstance.post<{ conversation: Conversation, message: Message }>(`/messages/with/${userId}`, { content });
        return data;
    }

    async markConversationAsRead(conversationId: string): Promise<{ success: boolean }> {
        const { data } = await this.axiosInstance.post<{ success: boolean }>(`/messages/conversations/${conversationId}/read`);
        return data;
    }
}
