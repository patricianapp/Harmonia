import CommandParams from "../handler/CommandParams";
import StartTyping from "../hooks/StartTyping";
import PostCheck from "../hooks/PostCheck";
import { Message } from "eris";
import NotDisabled from "../checks/NotDisabled";
import { Shares } from "../entities/Shares";
import { MoreThan } from 'typeorm';

export default class ListCommand extends CommandParams {

    public constructor() {
        super(`leaderboard`, {
            description: `Top voted tracks/albums over a time period.`,
            usage: [
                `leaderboard`,
                `leaderboard <time period>`,
                `leaderboard <time period> <list length>`,
                `leaderboard <time period> <list length> <user>`
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
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        // TODO: Limit to guild
        const shares = await Shares.find({
            where: {
                datePosted: MoreThan(lastWeek),
                guild: message.guildID
            },
            order: {
                votes: 'DESC'
            },
            take: 10,
            relations: ['user']
        });

        const reply = '**Leaderboard**\n' + shares.map((post: Shares) =>
            `${post.displayTitle} (posted by <@${post.user.discordUserID}> in #${post.channelName}: **${post.votes} votes**)`
        ).join('\n');
        await message.channel.createMessage(reply)
    }
}
