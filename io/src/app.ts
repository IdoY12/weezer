import { Server } from "socket.io";
import config from 'config'

// Create Socket.IO server instance with global CORS policy.
const server = new Server({
    // Allow all origins (development-friendly, less strict for production).
    cors: {
        origin: '*'
    }
})

// In-memory map: userId -> set of active socketIds for that user.
// Map = key/value store, Set = unique socketIds (no duplicates).
const socketIdsByUserId = new Map<string, Set<string>>();

// Register a socket connection under a user.
function addSocketForUser(userId: string, socketId: string) {
    // Get existing sockets for this user or create an empty set.
    const sockets = socketIdsByUserId.get(userId) ?? new Set<string>();
    // Add current socket id (Set keeps values unique).
    sockets.add(socketId);
    // Save updated set back into the map.
    socketIdsByUserId.set(userId, sockets);
}

// Remove a socket connection from a user.
function removeSocketForUser(userId: string, socketId: string) {
    // Read current socket set for this user.
    const sockets = socketIdsByUserId.get(userId);
    // If user has no tracked sockets, nothing to remove.
    if (!sockets) return;
    // Remove this specific disconnected socket.
    sockets.delete(socketId);
    // Clean up map entry when user has no active sockets left.
    if (sockets.size === 0) {
        socketIdsByUserId.delete(userId);
    }
}

// Emit an event only to specific target users.
function emitToUsers(eventName: string, payload: any, targetUserIds: string[]) {
    // Deduplicate and normalize target user ids.
    const uniqueUserIds = [...new Set(targetUserIds.map(id => String(id)))];
    // Iterate over each target user.
    uniqueUserIds.forEach(userId => {
        // Lookup active sockets for this user.
        const socketIds = socketIdsByUserId.get(userId);
        // If user is not currently connected, skip.
        if (!socketIds) return;
        // Emit event to each active socket for this user.
        socketIds.forEach(socketId => {
            server.to(socketId).emit(eventName, payload);
        });
    });
}

// Runs on every NEW socket connection (new tab, page refresh, reconnect).
server.on('connection', socket => {
    // Log connected socket id.
    console.log(`✅ Client connected - Socket ID: ${socket.id}`)
    // userId source is backend (JWT), then frontend forwards it in Socket.IO handshake auth.
    const userIdFromHandshake = socket.handshake.auth?.userId;
    // Normalize userId to string (or empty string if missing).
    const userId = userIdFromHandshake ? String(userIdFromHandshake) : "";

    // Bind this socket to the user.
    if (userId) {
        addSocketForUser(userId, socket.id);
        console.log(`👤 Registered socket ${socket.id} for user ${userId}`);
    }

    // Catch every incoming event on this socket.
    socket.onAny((eventName: string, payload: any) => {
        // Log incoming event for debugging.
        console.log(`📥 IO server received event: ${eventName}`, payload)
        // Read optional list of userIds to target.
        const targetUserIds = Array.isArray(payload?.targetUserIds)
            ? payload.targetUserIds.map((id: unknown) => String(id))
            : [];

        // If event has target users, do targeted delivery only.
        if (targetUserIds.length > 0) {
            console.log(`📤 IO server emitting ${eventName} to users:`, targetUserIds);
            emitToUsers(eventName, payload, targetUserIds);
            return;
        }

        // Otherwise broadcast event to all connected clients.
        console.log(`📤 IO server broadcasting event: ${eventName} to all clients`)
        server.emit(eventName, payload)
    })

    // Cleanup on disconnect (old socket after refresh gets removed here).
    // Frontend also calls socket.disconnect() on unmount, so cleanup is usually fast.
    socket.on('disconnect', (reason) => {
        // Remove this socket from user mapping if user was identified.
        if (userId) {
            removeSocketForUser(userId, socket.id);
        }
        // Log disconnect reason.
        console.log(`⚠️ Client disconnected - Socket ID: ${socket.id}, Reason: ${reason}`)
    })
})

// Start listening on configured port.
server.listen(config.get('port'))
// Log server startup.
console.log(`server started on port ${config.get('port')}`)