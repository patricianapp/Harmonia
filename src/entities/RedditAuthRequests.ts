import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne } from "typeorm";
import { Users } from "./Users";
import { Guilds } from "./Guilds";

@Entity(`reddit_auth_requests`)
export class RedditAuthRequests extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @OneToOne(() => Guilds)
    @JoinColumn()
    guild!: Guilds;

    @Column()
    discordMessageID!: string;

    @Column()
    discordUserID!: string;
}
