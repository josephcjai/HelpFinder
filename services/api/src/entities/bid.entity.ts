import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm'
import { UserEntity } from './user.entity'
import { TaskEntity } from './task.entity'
import { BidStatus } from '@helpfinder/shared'

@Entity('bids')
export class BidEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('decimal')
  amount!: number

  @Column({ nullable: true })
  message?: string

  @Column({
    type: 'varchar', // Use varchar for simple string enum storage
    default: 'pending'
  })
  status!: BidStatus

  @CreateDateColumn()
  createdAt!: Date

  @ManyToOne(() => TaskEntity, (task) => task.bids, { onDelete: 'CASCADE' })
  task!: TaskEntity

  @Column()
  helperId!: string

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  helper!: UserEntity
}
