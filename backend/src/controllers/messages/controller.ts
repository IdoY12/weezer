import { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";
import SocketMessages from "socket-enums-idoyahav";
import Conversation from "../../models/Conversation";
import Message from "../../models/Message";
import User from "../../models/User";
import socket from "../../io/io";

// ensureMessagesTablesReady() makes sure the
//  Conversation and Message tables are ready before handling message operations.
let ensureMessagesTablesReadyPromise: Promise<void> | null = null;

// Keep one shared promise for table-ready work (or null before first run).
async function ensureMessagesTablesReady(): Promise<void> {
    // If this is the first call, create the "sync tables" promise.
    if (!ensureMessagesTablesReadyPromise) {
        // Save the running async task so all callers reuse the same one.
        ensureMessagesTablesReadyPromise = (async () => {
            // Ensure Conversation table exists / matches model.
            await Conversation.sync();
            // Ensure Message table exists / matches model.
            await Message.sync();
            // End of one-time sync task.
        })();
    }

    // Wait for the shared sync task (first call runs it, later calls just await it).
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

    // Create chat row using users.id PK values (participantOneId/participantTwoId).
    return Conversation.create({ participantOneId, participantTwoId });
}

// currentUserId = the user we are building the inbox list for.
// Important: after sendMessage, this function is called for BOTH sides:
// sender (req.userId) and recipient (req.params.userId), to sync chat lists for each user.
async function buildConversationList(currentUserId: string) {
    // Step 1: get all conversations where currentUserId is one of the two participants.
    const conversations = await Conversation.findAll({
        where: {
            [Op.or]: [
                { participantOneId: currentUserId },
                { participantTwoId: currentUserId }
            ]
        },
        // Newest active conversations first (inbox behavior).
        order: [["updatedAt", "DESC"]]
    });

    // Step 2: "hydrate" each raw conversation with UI-ready fields:
    // otherUser, lastMessage, unreadCount.
    const hydrated = await Promise.all(conversations.map(async conversation => {
        // otherUser = "the other participant" relative to currentUserId.
        // If current user is participantOne, other is participantTwo, and vice versa. (!were in map!)
        const otherUserId = conversation.participantOneId === currentUserId
            ? conversation.participantTwoId
            : conversation.participantOneId;

        // Load extra data needed by the conversation list UI.
        const [otherUser, lastMessage, unreadCount] = await Promise.all([
            // Profile card of the other participant (without sensitive fields).
            User.findByPk(otherUserId, { attributes: { exclude: ["password", "email", "googleId"] } }),
            // Last message shown in conversation preview.
            Message.findOne({
                where: { conversationId: conversation.id },
                order: [["createdAt", "DESC"]],
                include: [User]
            }),
            // Unread messages for currentUserId only:
            // count messages in this conversation that were sent by someone else and not read yet.
            Message.count({
                where: {
                    conversationId: conversation.id,
                    senderId: { [Op.ne]: currentUserId },
                    readAt: null
                }
            })
        ]);

        // Return enriched conversation object for THIS currentUserId.
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

        // Step 1: find existing chat row (or create one) for sender + recipient.
        // This returns one conversation.id used as the foreign key for messages.
        const conversation = await findOrCreateConversation(req.userId, req.params.userId);
        // Step 2: insert a new message row linked to that conversation and sender.
        const message = await Message.create({
            conversationId: conversation.id,
            senderId: req.userId,
            content: req.body.content,
            readAt: null
        });
        // Step 3: reload THIS message row from DB and include User relation (= sender user data).
        // We are not reloading the recipient object here.
        await message.reload({ include: [User] });
        // Step 4: bump conversation.updatedAt so this chat moves to top in inbox ordering.
        await conversation.update({ updatedAt: new Date() });

        // Build separate conversation lists for both users in this chat action:
        // conversationsForSender -> sender's own inbox view
        // conversationsForRecipient -> recipient's own inbox view
        const [sender, conversationsForSender, conversationsForRecipient] = await Promise.all([
            User.findByPk(req.userId, { attributes: { exclude: ["password", "email", "googleId"] } }),
            buildConversationList(req.userId),
            buildConversationList(req.params.userId)
        ]);

        // Build one payload object reused for realtime emits.
      const basePayload = {
            from: req.get("x-client-id"),
            conversationId: conversation.id,
            // message comes from Message.create(...) above, then message.reload(...), then converted to plain JSON.
            message: message.get({ plain: true }),
            // sender is the user who sent this message (loaded by User.findByPk(req.userId) above).
            // sender should normally exist; this optional/fallback is defensive for rare edge cases.
            sender: sender?.get({ plain: true }) ?? null,
            // recipient is the target user loaded by User.findByPk(req.params.userId) above.
            recipient: recipient.get({ plain: true }),
            // Sender userId = req.userId, recipient userId = req.params.userId.
            // targetUserIds includes BOTH users so both clients get realtime updates.
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
