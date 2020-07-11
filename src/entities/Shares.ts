import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToMany, Check, CreateDateColumn, JoinTable, ManyToOne } from "typeorm";
import { Users } from "./Users";

@Entity(`shares`)
export class Shares extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Users, {eager: true})
    user!: Users;

    @Column({ unique: true })
    discordMessageID!: string;

    @Column()
    discordGuildID!: string;

    @CreateDateColumn()
    datePosted!: Date

    @Column()
    channelName!: string;

    @Column()
    mediaType!: string;

    @Column()
    displayTitle!: string;

    @Column({ default: 0 })
    votes!: number;

    @Column({ nullable: true })
    title?: string;

    @Column({ nullable: true })
    artist?: string;

    @Column({ nullable: true })
    redditPostLink?: string;

    @Column({ nullable: true })
    youtubeLink?: string;

    @Column({ nullable: true })
    youtubeTitle?: string;

    @Column({ nullable: true })
    spotifyLink?: string;
}
