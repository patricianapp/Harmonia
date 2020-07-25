import { GuildSettings } from "../entities/Guilds";
import { getDateRangeDay, DateRange, getDateRangeWeek, getDateRangeMonth, dayNames } from "../utils/DateRange";
import { Shares } from "../entities/Shares";
import { Between } from "typeorm";
import FMcord from "../handler/FMcord";
import { TextChannel } from "eris";

export const leaderboardPost = async (guildSettings: GuildSettings, guildID: string, client: FMcord) => {
    if(!guildSettings.leaderboard.channelID) {
        return;
    }

    const { resetHour, weekResetDay, frequency } = guildSettings.leaderboard;
    const offset = guildSettings.timeZoneOffset;
    let resetHourLocalized = (resetHour + offset) % 24;
    if(resetHourLocalized < 0) resetHourLocalized += 24;
    let resetStr = '';

    let dateRange: DateRange;

    switch(frequency) {
        case 0:
            resetStr = `Daily leaderboard resets at ${resetHourLocalized}:00`;
            dateRange = getDateRangeDay(resetHour);
            break;
        case 1:
            resetStr = `Weekly leaderboard resets every ${dayNames[weekResetDay]} at ${resetHourLocalized}:00`;
            dateRange = getDateRangeWeek(weekResetDay, resetHour);
            break;
        case 2:
            resetStr = `Monthly leaderboard resets on the 1st of each month`;
            dateRange = getDateRangeMonth(offset);
            break;
        default:
            resetStr = `Weekly leaderboard resets every ${dayNames[weekResetDay]} at ${resetHourLocalized}:00`;
            dateRange = getDateRangeWeek(weekResetDay, resetHour);
            break;
    }
    console.log(dateRange);
    const shares = await Shares.find({
        where: {
            datePosted: Between(...dateRange),
            discordGuildID: guildID,
        },
        order: {
            votes: 'DESC'
        },
        take: 10,
        relations: ['user']
    });

    const reply = '**Leaderboard**\n' + shares.map((post: Shares) =>
        `${post.displayTitle} (posted by <@${post.user.discordUserID}> in #${post.channelName}: ${post.votes} votes)`
    ).join('\n') + '\n' + resetStr;
    await (client.getChannel(guildSettings.leaderboard.channelID) as TextChannel).createMessage(reply);


}
