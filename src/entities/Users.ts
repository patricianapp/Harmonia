import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";

@Entity(`users`)
export class Users extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    discordUserID!: string;

    @Column({ nullable: true })
    lastFMUsername?: string;

}
