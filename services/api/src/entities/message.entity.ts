import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm'
import { ChatRoomEntity } from './chat-room.entity'
import { UserEntity } from './user.entity'

@Entity('messages')
export class MessageEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column()
    roomId!: string

    @ManyToOne(() => ChatRoomEntity, room => room.messages, { onDelete: 'CASCADE' })
    room!: ChatRoomEntity

    @Column()
    senderId!: string

    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
    sender!: UserEntity

    @Column('text')
    content!: string

    @Column({ type: 'boolean', default: false })
    isRead!: boolean

    @CreateDateColumn()
    createdAt!: Date
}
