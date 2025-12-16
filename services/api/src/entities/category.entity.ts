import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { TaskEntity } from './task.entity'

@Entity('categories')
export class CategoryEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column({ unique: true })
    name!: string

    @Column({ nullable: true })
    icon?: string

    @Column({ nullable: true })
    color?: string


    @CreateDateColumn()
    createdAt!: Date

    @UpdateDateColumn()
    updatedAt!: Date

    @OneToMany(() => TaskEntity, (task) => task.category)
    tasks!: TaskEntity[]
}
