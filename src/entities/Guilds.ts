import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import NowPlayingMode from "../enums/NowPlayingMode";

export enum LeaderboardFrequency {
    Daily,
    Weekly,
    Monthly
};

export interface LeaderboardPostTimeDaily {
    frequency: LeaderboardFrequency.Daily;
    hour: number;
}

export interface LeaderboardPostTimeWeekly{
    frequency: LeaderboardFrequency.Weekly;
    day: number;
    hour: number;
}

export interface LeaderboardPostTimeMonthly {
    frequency: LeaderboardFrequency.Monthly;
    hour: number;
}

export type LeaderboardPostTime =
    LeaderboardPostTimeDaily |
    LeaderboardPostTimeWeekly |
    LeaderboardPostTimeMonthly;

export interface GuildSettings {
    prefix: string;
    timeZoneOffset: number;
    nowPlayingMode: NowPlayingMode;
    reddit: {
        auth?: {
            bearerToken?: string;
            bearerTokenDate?: Date;
            refreshToken?: string;
            authorizationId?: string;
        }
        subredditName?: string;
        autoFlair: boolean;
    }
    leaderboard: {
        enable: boolean;
        frequency: LeaderboardFrequency;
        weekResetDay: number;
        resetHour: number;
        channelName?: string;
    }
    spotify: {
        auth?: {
            bearerToken?: string;
            refreshToken?: string;
        }
        playlist?: {
            postTime: LeaderboardPostTime;
            playlistId?: string;
            albumPlaylistId?: string;
            amountOfTracks?: number; // if undefined, posts all tracks every week
            amountOfAlbums?: number; // if undefined, posts all albums every week
            enableMinTracks: boolean; // keep some of last week's tracks if there aren't enough
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
