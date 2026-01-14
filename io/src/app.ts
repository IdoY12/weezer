import { Server } from "socket.io";
import config from 'config'

const server = new Server({
    cors: {
        origin: '*'
    }
})

server.on('connection', socket => {
    console.log(`✅ Client connected - Socket ID: ${socket.id}`)

    socket.onAny((eventName: string, payload: any) => {
        console.log(`📥 IO server received event: ${eventName}`, payload)
        console.log(`📤 IO server broadcasting event: ${eventName} to all clients`)
        server.emit(eventName, payload)
    })

    socket.on('disconnect', (reason) => {
        console.log(`⚠️ Client disconnected - Socket ID: ${socket.id}, Reason: ${reason}`)
    })
})

server.listen(config.get('port'))
console.log(`server started on port ${config.get('port')}`)