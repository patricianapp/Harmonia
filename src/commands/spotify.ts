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
                    if(message.guildID && (message.channel as TextChannel).name && responseMessage && responseMessage.content.includes('https://open.spotify.com/')) {
                        const client = responseMessage.channel.client as FMcord;
                        const trackId = responseMessage.content.split('//open.spotify.com/track/')[1];
                        const { spotify } = client.apikeys;
                        const lib = new Spotify(spotify!.id, spotify!.secret);
                        const track = await lib.findTrackById(trackId)
                        const artists = track.artists.map(artist => artist.name);
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

                        const userFetcher = new UserFetcher(message);
                        const user = await userFetcher.getAuthor();
                        if(user !== undefined) {
                            // save to database
                            const newShare = new Shares();
                            newShare.user = user;
                            newShare.discordMessageID = responseMessage.id;
                            newShare.discordGuildID = message.guildID;
                            newShare.channelName = (message.channel as TextChannel).name;
                            newShare.mediaType = 'track';
                            newShare.title = track.name;
                            newShare.artist = artistStr;
                            newShare.spotifyLink = track.external_urls.spotify;
                            newShare.displayTitle = `${track.artists[0].name} - ${track.name}`;
                            await newShare.save();
                            console.log(`Share saved with ID ${newShare.id}`);

                            // get youtube info
                            const yt = new YouTubeRequest(client.apikeys.youtube!);
                            const data = await yt.search(`${track.artists[0].name} ${track.name}`);
                            const result = data.items[0];
                            if (result !== undefined) {
                                newShare.youtubeLink = `https://youtu.be/${result.id.videoId}`;
                                await newShare.save();
                            }

                            // post to reddit
                            const reddit = new RedditPoster(config.reddit);
                            const postId = await reddit.post({
                                title: `${artistStr} - ${track.name}`,
                                url: track.external_urls.spotify,
                                sr: config.reddit.subredditName
                            }, newShare.channelName);
                            newShare.redditPostLink = `https://reddit.com/r/${config.reddit.subredditName}/comments/${postId}`;
                            newShare.save();

                            // TODO: update response message
                        }
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
                        discordMessageID: message.id
                    });
                    if(share) {
                        share.votes++;
                        share.save();
                    }
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
            const track = await lib.findTrack(args.join(` `));
            if (track.tracks.items[0]) {
                return track.tracks.items[0].external_urls.spotify;
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
                const track = await lib.findTrack(`${song.name} ${song.artist[`#text`]}`);
                if (track.tracks.items[0]) {
                    return track.tracks.items[0].external_urls.spotify;
                } else {
                    await message.channel.createMessage(`${message.author.mention}, your listened track wasn't found on Spotify.`);
                }
            }
        }
    }

}
