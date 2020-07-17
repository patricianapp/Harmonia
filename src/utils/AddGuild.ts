import { Guilds, LeaderboardFrequency } from "../entities/Guilds"
import NowPlayingMode from "../enums/NowPlayingMode";

export default async (discordID: string): Promise<Guilds> => {
    let guild = await Guilds.findOne({discordID});
    if(guild) {
        return guild;
    }

    guild = new Guilds();
    guild.discordID = discordID;
    guild.guildSettings = {
        prefix: '&',
        timeZoneOffset: 0,
        nowPlayingMode: NowPlayingMode.FULL,
        reddit: {
            autoFlair: true,
        },
        leaderboard: {
            enable: true,
            frequency: LeaderboardFrequency.Weekly,
            weekResetDay: 1,
            resetHour: 9,
        },
        spotify: {}
    }
    guild.nowPlayingMode = NowPlayingMode.FULL;
    return guild.save();
}
