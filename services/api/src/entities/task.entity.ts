import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'

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

  @Column({ default: 'open' })
  status!: TaskStatus

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}

