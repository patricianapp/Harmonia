import CommandParams from "../handler/CommandParams";
import StartTyping from "../hooks/StartTyping";
import PostCheck from "../hooks/PostCheck";
import { Message } from "eris";
import NotDisabled from "../checks/NotDisabled";
import { Shares } from "../entities/Shares";
import { Between } from 'typeorm';
import { Guilds } from "../entities/Guilds";
import { getDateRangeDay, DateRange, getDateRangeWeek, getDateRangeMonth, dayNames } from "../utils/DateRange";

export default class ListCommand extends CommandParams {

    public constructor() {
        super(`leaderboard`, {
            description: `Top voted tracks/albums over a time period.`,
            usage: [
                `leaderboard`,
                `leaderboard <time period>`,
            ].join(`, `),
            requirements: {
                custom: NotDisabled,
            },
            hooks: {
                preCommand: StartTyping,
                postCheck: PostCheck
            },
        });
    }

    public async execute(message: Message, args: string[]): Promise<void> {
        const timePeriod = args[0] ?? 'weekly';
        const { guildSettings } = await Guilds.findOneOrFail({discordID: message.guildID});
        const { resetHour, weekResetDay } = guildSettings.leaderboard;
        const offset = guildSettings.timeZoneOffset;
        let resetHourLocalized = (resetHour + offset) % 24;
        if(resetHourLocalized < 0) resetHourLocalized += 24;
        let resetStr = '';

        let dateRange: DateRange;

        switch(timePeriod) {
            case 'daily':
                resetStr = `Daily leaderboard resets at ${resetHourLocalized}:00`;
                dateRange = getDateRangeDay(resetHour);
                break;
            case 'weekly':
                resetStr = `Weekly leaderboard resets every ${dayNames[weekResetDay]} at ${resetHourLocalized}:00`;
                dateRange = getDateRangeWeek(weekResetDay, resetHour);
                break;
            case 'monthly':
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
                discordGuildID: message.guildID,
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
        await message.channel.createMessage(reply);
    }
}
