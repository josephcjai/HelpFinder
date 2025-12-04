import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { UserEntity } from './user.entity'
import { BidEntity } from './bid.entity'
import { TaskStatus } from '@helpfinder/shared'

@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  requesterId!: string

  @Column()
  title!: string

  @Column({ nullable: true })
  description?: string

  @Column({ nullable: true })
  category?: string

  @Column('float', { nullable: true })
  budgetMin?: number

  @Column('float', { nullable: true })
  budgetMax?: number

  @Column('float', { nullable: true })
  latitude?: number

  @Column('float', { nullable: true })
  longitude?: number

  @Column({ nullable: true })
  address?: string

  @Column({ type: 'varchar', default: 'open' })
  status!: TaskStatus

  @Column({ nullable: true })
  completedAt?: Date

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @ManyToOne(() => UserEntity, (user) => user.tasks, { onDelete: 'CASCADE' })
  requester!: UserEntity

  @OneToMany(() => BidEntity, (bid) => bid.task)
  bids!: BidEntity[]
}
