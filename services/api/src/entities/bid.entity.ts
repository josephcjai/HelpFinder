import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export type BidStatus = 'pending' | 'accepted' | 'withdrawn' | 'declined' | 'expired'

@Entity('bids')
export class BidEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  taskId!: string

  @Column()
  helperId!: string

  @Column('decimal')
  amount!: number

  @Column({ nullable: true })
  message?: string

  @Column({ default: 'pending' })
  status!: BidStatus

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}

