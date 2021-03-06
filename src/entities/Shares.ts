import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToMany, Check, CreateDateColumn, JoinTable, ManyToOne } from "typeorm";
import { Users } from "./Users";
import { Message, TextChannel } from "eris";

@Entity(`shares`)
export class Shares extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Users, {eager: true})
    user!: Users;

    @Column({ unique: true })
    discordRequestMessageID!: string;

    @Column({ unique: true })
    discordLinkMessageID!: string;

    @Column({ unique: true, nullable: true })
    discordInfoMessageID?: string;

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
    redditPostId?: string;

    @Column({ nullable: true })
    youtubeLink?: string;

    @Column({ nullable: true })
    youtubeTitle?: string;

    @Column({ nullable: true })
    spotifyLink?: string;

    @Column({ nullable: true })
    spotifyId?: string;


    public constructor(params?: {linkMessage: Message, infoMessage?: Message, user: Users, displayTitle?: string, title?: string, artist?: string}) {
        super();
        if(params && (params.displayTitle || (params.title && params.artist))) {
            this.user = params.user;
            this.discordLinkMessageID = params.linkMessage.id;
            this.channelName = (params.linkMessage.channel as TextChannel).name;

            if(params.displayTitle) {
                this.displayTitle = params.displayTitle;
            }
            else {
                this.displayTitle = `${params.artist} - ${params.title}`;
                this.title = params.title;
                this.artist = params.artist;
            }

            if(params.linkMessage.guildID) {
                this.discordGuildID = params.linkMessage.guildID;
            }
            if(params.infoMessage) {
                this.discordInfoMessageID = params.infoMessage.id;
            }


        }
    }
}
