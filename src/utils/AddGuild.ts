import { Guilds } from "../entities/Guilds"
import NowPlayingMode from "../enums/NowPlayingMode";

export default async (discordID: string): Promise<Guilds> => {
    let guild = await Guilds.findOne({discordID});
    if(guild) {
        return guild;
    }

    guild = new Guilds();
    guild.discordID = discordID;
    guild.guildSettings = {
        nowPlayingMode: NowPlayingMode.FULL,
        reddit: {
            autoFlair: true,
        },
        leaderboard: {
            enable: true,
            postTime: {
                day: 5,
                hour: 12
            }
        },
        spotify: {}
    }
    guild.nowPlayingMode = NowPlayingMode.FULL;
    return guild.save();
}
