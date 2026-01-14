import config from 'config'
import io from 'socket.io-client'

const socketUrl = `http://${config.get('io.host')}:${config.get('io.port')}`
console.log(`🔌 Backend connecting to Socket.io server at: ${socketUrl}`)

const socket = io(socketUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
})

let isConnected = false;

socket.on('connect', () => {
    isConnected = true;
    console.log('✅ Backend socket connected to IO server!');
    console.log(`   Socket ID: ${socket.id}`);
})

socket.on('connect_error', (error) => {
    isConnected = false;
    console.error('❌ Backend socket connection error:', error.message)
})

socket.on('disconnect', (reason) => {
    isConnected = false;
    console.log(`⚠️ Backend socket disconnected: ${reason}`)
})

// Helper function to emit events, queuing them if not connected
function emitEvent(eventName: string, payload: any) {
    if (isConnected) {
        console.log(`📤 Backend emitting ${eventName} (connected)`);
        socket.emit(eventName, payload);
    } else {
        console.warn(`⚠️ Backend socket not connected, queueing ${eventName}`);
        // Socket.io client automatically queues events, but log for debugging
        socket.emit(eventName, payload);
    }
}

// Export both socket and emitEvent helper
export default socket;
export { emitEvent };
