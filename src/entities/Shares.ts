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
    mediaType!: string;

    // Spotify/Last.fm title if it exists, otherwise YouTube title.
    @Column()
    title!: string;

    @Column({ default: 0 })
    votes!: number;

    @Column({ nullable: true })
    redditPostLink?: string;

    @Column({ nullable: true })
    youtubeLink?: string;

    @Column({ nullable: true })
    youtubeTitle?: string;

    @Column({ nullable: true })
    spotifyLink?: string;

    @Column({ nullable: true })
    artist?: string;


}
