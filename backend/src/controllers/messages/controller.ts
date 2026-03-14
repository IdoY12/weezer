import { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";
import SocketMessages from "socket-enums-idoyahav";
import Conversation from "../../models/Conversation";
import Message from "../../models/Message";
import User from "../../models/User";
import socket from "../../io/io";

let ensureMessagesTablesReadyPromise: Promise<void> | null = null;

async function ensureMessagesTablesReady(): Promise<void> {
    if (!ensureMessagesTablesReadyPromise) {
        ensureMessagesTablesReadyPromise = (async () => {
            await Conversation.sync();
            await Message.sync();
        })();
    }

    await ensureMessagesTablesReadyPromise;
}

function normalizeParticipants(userA: string, userB: string): [string, string] {
    return userA < userB ? [userA, userB] : [userB, userA];
}

async function findOrCreateConversation(userA: string, userB: string): Promise<Conversation> {
    const [participantOneId, participantTwoId] = normalizeParticipants(userA, userB);

    const existing = await Conversation.findOne({
        where: { participantOneId, participantTwoId }
    });

    if (existing) return existing;

    return Conversation.create({ participantOneId, participantTwoId });
}

async function buildConversationList(currentUserId: string) {
    const conversations = await Conversation.findAll({
        where: {
            [Op.or]: [
                { participantOneId: currentUserId },
                { participantTwoId: currentUserId }
            ]
        },
        order: [["updatedAt", "DESC"]]
    });

    const hydrated = await Promise.all(conversations.map(async conversation => {
        const otherUserId = conversation.participantOneId === currentUserId
            ? conversation.participantTwoId
            : conversation.participantOneId;

        const [otherUser, lastMessage, unreadCount] = await Promise.all([
            User.findByPk(otherUserId, { attributes: { exclude: ["password", "email", "googleId"] } }),
            Message.findOne({
                where: { conversationId: conversation.id },
                order: [["createdAt", "DESC"]],
                include: [User]
            }),
            Message.count({
                where: {
                    conversationId: conversation.id,
                    senderId: { [Op.ne]: currentUserId },
                    readAt: null
                }
            })
        ]);

        return {
            ...conversation.get({ plain: true }),
            otherUser: otherUser?.get({ plain: true }) ?? null,
            lastMessage: lastMessage?.get({ plain: true }) ?? null,
            unreadCount
        };
    }));

    return hydrated;
}

export async function getConversations(req: Request, res: Response, next: NextFunction) {
    try {
        await ensureMessagesTablesReady();
        const list = await buildConversationList(req.userId);
        res.json(list);
    } catch (e) {
        next(e);
    }
}

export async function getConversationMessages(req: Request<{ conversationId: string }>, res: Response, next: NextFunction) {
    try {
        await ensureMessagesTablesReady();
        const conversation = await Conversation.findByPk(req.params.conversationId);
        if (!conversation) {
            return next({ status: 404, message: "conversation not found" });
        }

        const isParticipant = conversation.participantOneId === req.userId || conversation.participantTwoId === req.userId;
        if (!isParticipant) {
            return next({ status: 403, message: "not your conversation" });
        }

        const messages = await Message.findAll({
            where: { conversationId: conversation.id },
            include: [User],
            order: [["createdAt", "ASC"]]
        });

        res.json({
            conversation: conversation.get({ plain: true }),
            messages: messages.map(message => message.get({ plain: true }))
        });
    } catch (e) {
        next(e);
    }
}

export async function sendMessageToUser(req: Request<{ userId: string }, unknown, { content: string }>, res: Response, next: NextFunction) {
    try {
        await ensureMessagesTablesReady();
        if (req.userId === req.params.userId) {
            return next({ status: 422, message: "cannot message yourself" });
        }

        const recipient = await User.findByPk(req.params.userId, {
            attributes: { exclude: ["password", "email", "googleId"] }
        });
        if (!recipient) {
            return next({ status: 404, message: "recipient not found" });
        }

        const conversation = await findOrCreateConversation(req.userId, req.params.userId);
        const message = await Message.create({
            conversationId: conversation.id,
            senderId: req.userId,
            content: req.body.content,
            readAt: null
        });
        await message.reload({ include: [User] });
        await conversation.update({ updatedAt: new Date() });

        const [sender, conversationsForSender, conversationsForRecipient] = await Promise.all([
            User.findByPk(req.userId, { attributes: { exclude: ["password", "email", "googleId"] } }),
            buildConversationList(req.userId),
            buildConversationList(req.params.userId)
        ]);

        const basePayload = {
            from: req.get("x-client-id"),
            conversationId: conversation.id,
            message: message.get({ plain: true }),
            sender: sender?.get({ plain: true }) ?? null,
            recipient: recipient.get({ plain: true }),
            targetUserIds: [req.userId, req.params.userId]
        };

        socket.emit(SocketMessages.NewComment, {
            ...basePayload,
            entityType: "chat-message"
        });

        socket.emit(SocketMessages.NewPost, {
            from: req.get("x-client-id"),
            entityType: "conversation-list-sync",
            targetUserIds: [req.userId, req.params.userId],
            conversationsByUserId: {
                [req.userId]: conversationsForSender,
                [req.params.userId]: conversationsForRecipient
            }
        });

        socket.emit(SocketMessages.NewPost, {
            from: req.get("x-client-id"),
            entityType: "unread-count-sync",
            targetUserIds: [req.userId, req.params.userId],
            unreadCountByUserId: {
                [req.userId]: conversationsForSender.reduce((sum, c) => sum + c.unreadCount, 0),
                [req.params.userId]: conversationsForRecipient.reduce((sum, c) => sum + c.unreadCount, 0)
            }
        });

        res.json({
            conversation: conversation.get({ plain: true }),
            message: message.get({ plain: true })
        });
    } catch (e) {
        next(e);
    }
}

export async function markConversationAsRead(req: Request<{ conversationId: string }>, res: Response, next: NextFunction) {
    try {
        await ensureMessagesTablesReady();
        const conversation = await Conversation.findByPk(req.params.conversationId);
        if (!conversation) {
            return next({ status: 404, message: "conversation not found" });
        }

        const isParticipant = conversation.participantOneId === req.userId || conversation.participantTwoId === req.userId;
        if (!isParticipant) {
            return next({ status: 403, message: "not your conversation" });
        }

        await Message.update(
            { readAt: new Date() },
            {
                where: {
                    conversationId: conversation.id,
                    senderId: { [Op.ne]: req.userId },
                    readAt: null
                }
            }
        );

        const conversations = await buildConversationList(req.userId);
        socket.emit(SocketMessages.NewPost, {
            from: req.get("x-client-id"),
            entityType: "conversation-list-sync",
            targetUserIds: [req.userId],
            conversationsByUserId: {
                [req.userId]: conversations
            }
        });

        socket.emit(SocketMessages.NewPost, {
            from: req.get("x-client-id"),
            entityType: "unread-count-sync",
            targetUserIds: [req.userId],
            unreadCountByUserId: {
                [req.userId]: conversations.reduce((sum, c) => sum + c.unreadCount, 0)
            }
        });

        res.json({ success: true });
    } catch (e) {
        next(e);
    }
}
