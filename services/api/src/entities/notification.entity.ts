import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { UserEntity } from './user.entity'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

@Entity('notifications')
export class NotificationEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column()
    userId!: string

    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: UserEntity

    @Column()
    message!: string

    @Column({ default: 'info' })
    type!: NotificationType

    @Column({ nullable: true })
    resourceId?: string // e.g., taskId or bidId

    @Column({ default: false })
    isRead!: boolean

    @CreateDateColumn()
    createdAt!: Date
}
