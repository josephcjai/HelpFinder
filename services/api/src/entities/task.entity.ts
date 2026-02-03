import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { UserEntity } from './user.entity'
import { BidEntity } from './bid.entity'
import { CategoryEntity } from './category.entity'
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
  categoryId?: string

  @ManyToOne(() => CategoryEntity, (category) => category.tasks, { onDelete: 'SET NULL', nullable: true })
  category?: CategoryEntity

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

  @Column({ nullable: true })
  country?: string

  @Column({ nullable: true })
  zipCode?: string

  @Column({ nullable: true, default: 'USD' })
  currency?: string

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
