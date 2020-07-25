import CommandParams from "../../handler/CommandParams";
import { Message } from "eris";
import { Prefixes } from "../../entities/Prefixes";
import FMcord from "../../handler/FMcord";
import NotDisabled from "../../checks/NotDisabled";
import StartTyping from "../../hooks/StartTyping";
import PostCheck from "../../hooks/PostCheck";
import { Guilds, LeaderboardFrequency } from "../../entities/Guilds";
import { CronJob } from "cron";
import { leaderboardPost } from "../../jobs/leaderboardPost";

export default class LeaderboardEnableSubcommand extends CommandParams {

    public constructor() {
        super(`enable`, {
            guildOnly: true,
            requirements: {
                permissions: {
                    manageGuild: true,
                },
                custom: NotDisabled
            },
            permissionMessage: (message: Message) => `${message.author.mention}, you do not have a permission \`Manage Guild\` to execute this command.`,
            hooks: {
                preCommand: StartTyping,
                postCheck: PostCheck
            }
        });
    }

    public async execute(message: Message, args: string[]): Promise<void> {
        const guildId = message.guildID;
        if(!guildId) {
            message.channel.createMessage(`This command must be entered in a guild.`);
            return;
        }
        const client = message.channel.client as FMcord;
        const currentCronJob = client.guildCronJobs[guildId].leaderboardPost;
        if(currentCronJob) {
            currentCronJob.stop();
        }

        const guild = await Guilds.findOneOrFail({discordID: guildId});
        let channelID = guild.guildSettings.leaderboard.channelID;
        let channelName = guild.guildSettings.leaderboard.channelName;
        if(args.length < 1 && !channelName) {
            message.channel.createMessage(`Please specify a channel.`);
            return;
        }
        if(args[0]) {
            channelName = args[0];
            const guild = client.guilds.get(guildId);
            channelID = guild?.channels.find(channel => channel.name === channelName)?.id;
            if(!channelID) {
                message.channel.createMessage(`Cannot find channel ${channelName}.`);
                return;
            }
        }

        guild.guildSettings.leaderboard.enable = true;
        guild.guildSettings.leaderboard.channelID = channelID;
        guild.guildSettings.leaderboard.channelName = channelName;
        guild.save();

        const { frequency, weekResetDay, resetHour } = guild.guildSettings.leaderboard;
        let leaderboardJob: CronJob;
        switch(frequency) {
            case LeaderboardFrequency.Daily:
                leaderboardJob = new CronJob(`0 0 ${resetHour} * * *`, () => {
                    leaderboardPost(guild.guildSettings, guildId, client);
                }, undefined, undefined, undefined, undefined, undefined, 0);
                break;
            case LeaderboardFrequency.Weekly:
                leaderboardJob = new CronJob(`0 0 ${resetHour} * * ${weekResetDay}`, () => {
                    leaderboardPost(guild.guildSettings, guildId, client);
                }, undefined, undefined, undefined, undefined, undefined, 0);
                break;
            case LeaderboardFrequency.Monthly:
                leaderboardJob = new CronJob(`0 0 ${resetHour} 1 * *`, () => {
                    leaderboardPost(guild.guildSettings, guildId, client);
                }, undefined, undefined, undefined, undefined, undefined, 0);
                break;
        }
        leaderboardJob.start();
        client.guildCronJobs[guildId].leaderboardPost = leaderboardJob;
        await message.channel.createMessage(`Leaderboard will post in channel ${channelName}`);
    }
}
