import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Unique } from 'typeorm'
import { TaskEntity } from './task.entity'
import { UserEntity } from './user.entity'
import { MessageEntity } from './message.entity'

@Entity('chat_rooms')
@Unique(['taskId', 'helperId']) // A task can only have one chat room per helper
export class ChatRoomEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column()
    taskId!: string

    @ManyToOne(() => TaskEntity, { onDelete: 'CASCADE' })
    task!: TaskEntity

    @Column()
    requesterId!: string

    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
    requester!: UserEntity

    @Column()
    helperId!: string

    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
    helper!: UserEntity

    @Column({ type: 'varchar', default: 'active' }) // 'active' | 'archived'
    status!: string

    @CreateDateColumn()
    createdAt!: Date

    @UpdateDateColumn()
    updatedAt!: Date

    @OneToMany(() => MessageEntity, message => message.room)
    messages!: MessageEntity[]
}
