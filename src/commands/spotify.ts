import CommandParams from "../handler/CommandParams";
import StartTyping from "../hooks/StartTyping";
import NotDisabled from "../checks/NotDisabled";
import { Message, MessageContent, TextChannel } from "eris";
import FMcord from "../handler/FMcord";
import { Disables } from "../entities/Disables";
import Spotify from "../lib/spotify";
import TrackFetcher from "../classes/TrackFetcher";
import { Shares } from "../entities/Shares";
import UserFetcher from "../classes/UserFetcher";
import YouTubeRequest from "../classes/YouTubeRequest";
import RedditPoster from "../classes/RedditPoster";
import config from '../config';
import ShareEmbed, { ShareEmbedUpdate } from "../classes/ShareEmbed";
import { Guilds } from "../entities/Guilds";

export default class SpotifyCommand extends CommandParams {

    public constructor() {
        super(`spotify`, {
            description: `Gets a link of a song from Spotify. If no song is provided, ` +
            `the bot will try to get your currently played track.`,
            usage: [`spotify <song name>`, `spotify`].join(`, `),
            aliases: [`sp`],
            hooks: {
                async postCheck(message: Message, args: string[], checksPassed: boolean): Promise<void> {
                    if (!checksPassed) {
                        const client = message.channel.client as FMcord;
                        const { spotify } = client.apikeys;
                        if (spotify?.id === undefined || spotify?.secret === undefined) {
                            message.channel.createMessage(`${message.author.mention}, some of the Spotify API credentials are missing, ` +
                            `therefore, this command cannot be used. Please contact the maintainer ` +
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
                preCommand: StartTyping,
                async postCommand(message, _args, responseMessage) {
                    const newShare = await Shares.findOne({
                        where: {
                            discordRequestMessageID: message.id
                        }
                    });
                    if(responseMessage && newShare && newShare.spotifyLink) {
                        const client = responseMessage.channel.client as FMcord;
                        const trackId = responseMessage.embeds[0].url?.split('//open.spotify.com/track/')[1];
                        if(!trackId) return;

                        // get youtube info
                        const yt = new YouTubeRequest(client.apikeys.youtube!);
                        const data = await yt.search(newShare.displayTitle);
                        const result = data.items[0];
                        if (result !== undefined) {
                            newShare.youtubeLink = `https://youtu.be/${result.id.videoId}`;
                            await newShare.save();
                        }

                        // post to reddit
                        const guild = await Guilds.findOneOrFail({discordID: message.guildID});
                        const reddit = new RedditPoster(guild.guildSettings.reddit);
                        const postId = await reddit.post({
                            title: `${newShare.artist} - ${newShare.title}`,
                            url: newShare.spotifyLink,
                        }, newShare.channelName);
                        newShare.redditPostLink = `https://reddit.com/r/${guild.guildSettings.reddit.subredditName}/comments/${postId}`;
                        newShare.redditPostId = `t3_${postId}`;
                        newShare.save();

                        // update response message
                        const embed = new ShareEmbed(message, newShare.spotifyLink, newShare);
                        await embed.update(responseMessage);
                        responseMessage.edit({ embed });
                    }
                }
            },
            requirements: {
                async custom(message: Message): Promise<boolean> {
                    const client = message.channel.client as FMcord;
                    const { spotify } = client.apikeys;
                    return spotify?.id !== undefined && spotify?.secret !== undefined && await NotDisabled(message);
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
            }],
            reactionButtonTimeout: 604800
        });
    }

    public async execute(message: Message, args: string[]): Promise<MessageContent | void> {
        const client = message.channel.client as FMcord;
        const { spotify } = client.apikeys;
        const lib = new Spotify(spotify!.id, spotify!.secret);
        if (args.length) {
            const result = await lib.findTrack(args.join(` `));
            if (result.tracks.items[0]) {
                    const track = result.tracks.items[0];

                    const linkMessage = await message.channel.createMessage(track.external_urls.spotify);
                    const embed = new ShareEmbed(message, track.external_urls.spotify, new Shares({
                        linkMessage,
                        user: await new UserFetcher(message).getAuthor(),
                        artist: track.artists[0].name,
                        title: track.name
                    }));
                    return { embed };
            } else {
                await message.channel.createMessage(`${message.author.mention}, nothing found when looking for \`${args.join(` `)}\``);
            }
        } else {
            const trackFetcher = new TrackFetcher(client, message);
            let song = await trackFetcher.getCurrentTrack();
            if (!song) {
                song = await trackFetcher.getLatestTrack();
            }
            if (song) {
                const result = await lib.findTrack(`${song.name} ${song.artist[`#text`]}`);
                if (result.tracks.items[0]) {
                    const track = result.tracks.items[0];
                    const linkMessage = await message.channel.createMessage(`${track.external_urls.spotify}`);

                    const artists = track.artists.map(artist => artist.name);

                    // TODO: Wrap this in util function
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

                    // save to database
                    const newShare = new Shares({
                        linkMessage,
                        user: await new UserFetcher(message).getAuthor(),
                        artist: artistStr,
                        title: track.name
                    });
                    newShare.discordRequestMessageID = message.id;
                    newShare.mediaType = 'track';
                    newShare.spotifyLink = track.external_urls.spotify;
                    await newShare.save();
                    console.log(`Share saved with ID ${newShare.id}`);

                    const embed = new ShareEmbed(message, track.external_urls.spotify, newShare);
                    return { embed };
                } else {
                    await message.channel.createMessage(`${message.author.mention}, your listened track wasn't found on Spotify.`);
                }
            }
        }
    }

}
