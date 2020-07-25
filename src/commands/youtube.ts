import CommandParams from "../handler/CommandParams";
import StartTyping from "../hooks/StartTyping";
import { Message, MessageContent, TextChannel } from "eris";
import FMcord from "../handler/FMcord";
import TrackFetcher from "../classes/TrackFetcher";
import snippets from "../snippets";
import YouTubeRequest from "../classes/YouTubeRequest";
import NotDisabled from "../checks/NotDisabled";
import { Disables } from "../entities/Disables";
import UserFetcher from "../classes/UserFetcher";
import { Shares } from "../entities/Shares";
import Spotify from "../lib/spotify";
import RedditPoster from "../classes/RedditPoster";
import config from '../config';
import ShareEmbed, { ShareEmbedUpdate } from "../classes/ShareEmbed";
import { Users } from "../entities/Users";
import { Guilds } from "../entities/Guilds";
import { processYtVideoTitle } from "../utils/YouTubeTitle";

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
                },
                async postCommand(message, args, responseMessage) {
                    const newShare = await Shares.findOne({
                        where: {
                            discordRequestMessageID: message.id
                        }
                    });
                    if(responseMessage && newShare && newShare.youtubeLink) {
                        const client = responseMessage.channel.client as FMcord;
                        newShare.discordInfoMessageID = responseMessage.id;

                        // get spotify info
                        const { spotify } = client.apikeys;
                        const lib = new Spotify(spotify!.id, spotify!.secret);
                        const spotifyQuery = newShare.displayTitle.replace(' - ', ' ');
                        const spotifyResult = await lib.findTrack(spotifyQuery);
                        if (spotifyResult.tracks.items[0]) {
                            const spotifyTrack = spotifyResult.tracks.items[0];
                            const artists = spotifyTrack.artists.map(artist => artist.name);
                            let artistStr: string;
                            if(artists.length >  2) {
                                artists[artists.length - 1] = '& ' + artists[artists.length - 1];
                                artistStr = artists.join(', ')
                            }
                            else if (artists.length === 2) {
                                artistStr = artists.join(' & ')
                            }
                            else {
                                artistStr = artists[0];
                            }

                            newShare.spotifyLink = spotifyTrack.external_urls.spotify;
                            newShare.title = spotifyTrack.name;
                            newShare.artist = artistStr;
                            newShare.displayTitle = `${spotifyTrack.artists[0].name} - ${spotifyTrack.name}`;
                            await newShare.save();
                        }

                        // post to reddit
                        const guild = await Guilds.findOneOrFail({discordID: message.guildID});
                        if(guild.guildSettings.reddit.auth) {
                            const reddit = new RedditPoster(guild.guildSettings.reddit, guild.discordID);
                            const postId = await reddit.post({
                                title: newShare.displayTitle,
                                url: newShare.youtubeLink,
                            }, newShare.channelName);
                            newShare.redditPostLink = `https://reddit.com/r/${guild.guildSettings.reddit.subredditName}/comments/${postId}`;
                            newShare.redditPostId = `t3_${postId}`;
                            newShare.save();
                        }

                        // update response message
                        const embed = new ShareEmbed(message, 'youtube', newShare);
                        await embed.update(responseMessage);
                        responseMessage.edit({ embed });
                    }
                }
            },
            requirements: {
                async custom(message: Message): Promise<boolean> {
                    return (message.channel.client as FMcord).apikeys.youtube !== undefined && await NotDisabled(message);
                }
            },
            reactionButtons: [{
                emoji: '🤘',
                type: 'edit',
                response: async (message: Message) => {
                    const share = await Shares.findOne({
                        discordInfoMessageID: message.id
                    });
                    if(share && share.youtubeLink) {
                        const embed = new ShareEmbedUpdate(message.embeds[0], message, share);
                        return { embed: await embed.getEmbed() };
                    }
                    return message;
                }
            },
            {
                emoji: '🔄',
                type: 'edit',
                response: async (message: Message) => {
                    const share = await Shares.findOne({
                        discordInfoMessageID: message.id
                    });
                    if(share && share.youtubeLink) {
                        const embed = new ShareEmbedUpdate(message.embeds[0], message, share);
                        return { embed: await embed.getEmbed() };
                    }
                    return message;
                }
            }
            ],
            reactionButtonTimeout: 604800
        });
    }


    public async execute(message: Message, args: string[]): Promise<MessageContent | void> {
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
            const linkMessage = await message.channel.createMessage(`${message.author.mention}, result for query \`${query}\`: https://youtu.be/${result.id.videoId}`);
            const { artist, track } = processYtVideoTitle(result.snippet.title);

            // save to database
            const newShare = new Shares({
                linkMessage,
                user: await new UserFetcher(message).getAuthor(),
                displayTitle: artist ? `${artist} - ${track}` : track
            });
            newShare.mediaType = 'track';
            newShare.discordRequestMessageID = message.id;
            newShare.youtubeTitle = result.snippet.title;
            newShare.youtubeLink = `https://youtu.be/${result.id.videoId}`;
            await newShare.save();
            console.log(`Share saved with ID ${newShare.id}`);

            const embed = new ShareEmbed(message, 'youtube', newShare);
            return { embed };
        } else {
            await message.channel.createMessage(`${message.author.mention}, no results found on query \`${query}\``);
        }
    }

}
