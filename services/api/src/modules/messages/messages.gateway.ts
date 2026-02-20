import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { MessagesService } from './messages.service'
import { Logger, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@WebSocketGateway({
    cors: {
        origin: '*', // Align with frontend config if possible
    },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server

    private logger = new Logger('MessagesGateway')

    // Track connected users: userId -> Set<SocketId>
    private connectedUsers = new Map<string, Set<string>>()

    constructor(private readonly messagesService: MessagesService) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`)
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`)
        // Remove from connected users
        this.connectedUsers.forEach((sockets, userId) => {
            if (sockets.has(client.id)) {
                sockets.delete(client.id)
                if (sockets.size === 0) {
                    this.connectedUsers.delete(userId)
                }
            }
        })
    }

    // Expects client to emit 'authenticate' with { userId } after connection, 
    // or pass token in headers/auth to be handled via AuthGuard. For simplicity here:
    @SubscribeMessage('join')
    handleJoin(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
        const { userId } = data
        if (!userId) return

        let userSockets = this.connectedUsers.get(userId)
        if (!userSockets) {
            userSockets = new Set<string>()
            this.connectedUsers.set(userId, userSockets)
        }
        userSockets.add(client.id)

        // Join a generic room for the user to receive DMs
        client.join(`user_${userId}`)
        this.logger.log(`User ${userId} joined with socket ${client.id}`)
    }

    // Join a specific chat room
    @SubscribeMessage('joinRoom')
    handleJoinRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
        client.join(`room_${data.roomId}`)
        this.logger.log(`Socket ${client.id} joined room ${data.roomId}`)
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @MessageBody() data: { roomId: string; senderId: string; content: string },
        @ConnectedSocket() client: Socket
    ) {
        try {
            const message = await this.messagesService.sendMessage(data.roomId, data.senderId, data.content)

            // Emit to everyone in the room (including sender to confirm)
            this.server.to(`room_${data.roomId}`).emit('newMessage', message)

            // Additionally, we might want to emit a notification to the specific receiving user's global channel
            // We would need the full room details to see who the other user is.
            // Easiest is just letting the frontend rely on the 'newMessage' in the active room.
        } catch (error: any) {
            this.logger.error(`Failed to send message: ${error.message}`)
            client.emit('error', { message: error.message })
        }
    }
}
