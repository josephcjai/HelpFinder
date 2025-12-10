import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { UserRole } from '@helpfinder/shared'
import { TaskEntity } from './task.entity'

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  email!: string

  @Column()
  passwordHash!: string

  @Column()
  name!: string

  @Column({ type: 'varchar', default: 'user' })
  role!: UserRole

  @OneToMany(() => TaskEntity, (task) => task.requester)
  tasks!: TaskEntity[]

  @Column({ default: false })
  isSuperAdmin!: boolean

  // Address Details
  @Column({ type: 'float', nullable: true })
  latitude?: number

  @Column({ type: 'float', nullable: true })
  longitude?: number

  @Column({ nullable: true })
  address?: string

  @Column({ nullable: true })
  country?: string

  @Column({ nullable: true })
  zipCode?: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}

