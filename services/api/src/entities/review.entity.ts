import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm'
import { UserEntity } from './user.entity'
import { TaskEntity } from './task.entity'

@Entity('reviews')
export class ReviewEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column()
    taskId!: string

    @ManyToOne(() => TaskEntity)
    task!: TaskEntity

    @Column()
    reviewerId!: string

    @ManyToOne(() => UserEntity)
    reviewer!: UserEntity

    @Column()
    targetUserId!: string

    @ManyToOne(() => UserEntity)
    targetUser!: UserEntity

    @Column({ type: 'varchar' })
    targetRole!: 'helper' | 'requester'

    @Column('int')
    rating!: number

    @Column({ type: 'text', nullable: true })
    comment?: string

    @CreateDateColumn()
    createdAt!: Date
}
