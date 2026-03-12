import { Server } from "socket.io";
import config from 'config'

const server = new Server({
    cors: {
        origin: '*'
    }
})

const socketIdsByUserId = new Map<string, Set<string>>();

function addSocketForUser(userId: string, socketId: string) {
    const sockets = socketIdsByUserId.get(userId) ?? new Set<string>();
    sockets.add(socketId);
    socketIdsByUserId.set(userId, sockets);
}

function removeSocketForUser(userId: string, socketId: string) {
    const sockets = socketIdsByUserId.get(userId);
    if (!sockets) return;
    sockets.delete(socketId);
    if (sockets.size === 0) {
        socketIdsByUserId.delete(userId);
    }
}

function emitToUsers(eventName: string, payload: any, targetUserIds: string[]) {
    const uniqueUserIds = [...new Set(targetUserIds.map(id => String(id)))];
    uniqueUserIds.forEach(userId => {
        const socketIds = socketIdsByUserId.get(userId);
        if (!socketIds) return;
        socketIds.forEach(socketId => {
            server.to(socketId).emit(eventName, payload);
        });
    });
}

server.on('connection', socket => {
    console.log(`✅ Client connected - Socket ID: ${socket.id}`)
    const userIdFromHandshake = socket.handshake.auth?.userId;
    const userId = userIdFromHandshake ? String(userIdFromHandshake) : "";

    if (userId) {
        addSocketForUser(userId, socket.id);
        console.log(`👤 Registered socket ${socket.id} for user ${userId}`);
    }

    socket.onAny((eventName: string, payload: any) => {
        console.log(`📥 IO server received event: ${eventName}`, payload)
        const targetUserIds = Array.isArray(payload?.targetUserIds)
            ? payload.targetUserIds.map((id: unknown) => String(id))
            : [];

        if (targetUserIds.length > 0) {
            console.log(`📤 IO server emitting ${eventName} to users:`, targetUserIds);
            emitToUsers(eventName, payload, targetUserIds);
            return;
        }

        console.log(`📤 IO server broadcasting event: ${eventName} to all clients`)
        server.emit(eventName, payload)
    })

    socket.on('disconnect', (reason) => {
        if (userId) {
            removeSocketForUser(userId, socket.id);
        }
        console.log(`⚠️ Client disconnected - Socket ID: ${socket.id}, Reason: ${reason}`)
    })
})

server.listen(config.get('port'))
console.log(`server started on port ${config.get('port')}`)