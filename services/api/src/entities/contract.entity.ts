import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export type ContractStatus = 'pending' | 'started' | 'delivered' | 'approved' | 'cancelled'

@Entity('contracts')
export class ContractEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  taskId!: string

  @Column()
  helperId!: string

  @Column('decimal')
  agreedAmount!: number

  @Column({ default: 'pending' })
  status!: ContractStatus

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}

