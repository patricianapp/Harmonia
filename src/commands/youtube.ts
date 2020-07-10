import CommandParams from "../handler/CommandParams";
import StartTyping from "../hooks/StartTyping";
import { Message } from "eris";
import FMcord from "../handler/FMcord";
import TrackFetcher from "../classes/TrackFetcher";
import snippets from "../snippets";
import YouTubeRequest from "../classes/YouTubeRequest";
import NotDisabled from "../checks/NotDisabled";
import { Disables } from "../entities/Disables";
import UserFetcher from "../classes/UserFetcher";
import { Shares } from "../entities/Shares";

export default class YouTubeCommand extends CommandParams {

    public constructor() {
        super(`youtube`, {
            description: `Gets a YouTube link of a searched song or video. If no query is specified, it looks at what you're playing right now.`,
            usage: [`youtube`, `youtube <search query>`].join(`, `),
            aliases: [`yt`, `share`],
            hooks: {
                preCommand: StartTyping,
                async postCheck(message: Message, args: string[], checkPassed: boolean): Promise<void> {
                    if (!checkPassed) {
                        if ((message.channel.client as FMcord).apikeys.youtube !== undefined) {
                            message.channel.createMessage(`${message.author.mention}, this bot is not supplied with a YouTube API key, ` +
                            `therefore, this command cannot be executed. Please contact the developer ` +
                            `of this bot.`);
                        } else {
                            const isDisabled = await Disables.findOne({
                                where: [
                                    { discordID: message.channel.id, cmdName: message.command?.label },
                                    { discordID: message.guildID, cmdName: message.command?.label }
                                ]
                            });
                            if (isDisabled !== undefined) {
                                const guildDisabled = isDisabled.discordID === message.guildID;
                                await message.channel.createMessage(`${message.author.mention}, command \`${message.command?.label}\` is disabled in ${guildDisabled ? message.member!.guild.name : `this channel`}`);
                            }
                        }
                    }
                }
            },
            requirements: {
                async custom(message: Message): Promise<boolean> {
                    return (message.channel.client as FMcord).apikeys.youtube !== undefined && await NotDisabled(message);
                }
            }
        });
    }

    public async execute(message: Message, args: string[]): Promise<void> {
        let query: string;
        const client = message.channel.client as FMcord;
        if (args.length > 0) {
            query = args.join(` `);
        } else {
            const trackFetcher = new TrackFetcher(client, message);
            const username = await trackFetcher.username();
            if (username !== null) {
                const data = await trackFetcher.getCurrentTrack();
                if (data !== null) {
                    query = `${data.name} ${data.artist[`#text`]}`;
                } else {
                    await message.channel.createMessage(`${message.author.mention}, ${snippets.notPlaying}`);
                    return;
                }
            } else {
                await message.channel.createMessage(`${message.author.mention}, ${snippets.npNoLogin}`);
                return;
            }
        }
        const yt = new YouTubeRequest(client.apikeys.youtube!);
        const data = await yt.search(query);
        const result = data.items[0];
        if (result !== undefined) {
            const reply = await message.channel.createMessage(`${message.author.mention}, result for query \`${query}\`: https://youtu.be/${result.id.videoId}`);
            await reply.addReaction('🤘');

            // save to database
            const userFetcher = new UserFetcher(message);
            const username = await userFetcher.username();
            if(username !== null) {

            }
            try {
                const currentUser = await userFetcher.getAuthor();
                if(currentUser !== undefined) {
                    // TODO: get spotify info

                    // TODO: post to reddit

                    // TODO: get reddit link

                    // save to database
                    const newShare = new Shares();
                    newShare.user = currentUser;
                    newShare.discordMessageID = reply.id;
                    newShare.mediaType = 'track';
                    newShare.title = result.snippet.title;
                    newShare.youtubeTitle = result.snippet.title;
                    newShare.youtubeLink = result.id.videoId;
                    await newShare.save();
                    console.log(`Share saved with ID ${newShare.id}`);
                }
            }
            catch(e) {
                await message.channel.createMessage(e);
                // if (e.message.endsWith(`404`)) {
                //     await message.channel.createMessage(`${message.author.mention}, no user with the name \`${args.join(` `)}\` found in Last.fm.`);
                // }
            }
        } else {
            await message.channel.createMessage(`${message.author.mention}, no results found on query \`${query}\``);
        }
    }

}
