import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import NowPlayingMode from "../enums/NowPlayingMode";

export interface GuildSettings {
    nowPlayingMode: NowPlayingMode
    reddit: {
        auth?: {
            bearerToken?: string;
            bearerTokenDate: Date;
            refreshToken?: string;
        }
        subredditName?: string;
        autoFlair: boolean;
    }
    leaderboard: {
        enable: boolean;
        postTime: {
            day?: number; // 0-7, weekly
            date?: number; // date of the month
            hour: number;
        }
        channelName?: string;
    }
    spotify: {
        auth?: {
            bearerToken?: string;
            refreshToken?: string;
        }
        playlist?: {
            playlistId?: string;
            albumPlaylistId?: string;
            amountOfTracks?: number; // if undefined, posts all tracks every week
            alwaysKeepAmount: boolean; // keep some of last week's tracks if there aren't enough


        }
    }
}

@Entity()
export class Guilds extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({unique: true})
    discordID!: string;

    @Column()
    nowPlayingMode!: NowPlayingMode;

    @Column('simple-json')
    guildSettings!: GuildSettings;
}
