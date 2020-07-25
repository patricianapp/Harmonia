import FMcordEmbed from "./FMcordEmbed";
import { Message, Command, Embed } from "eris";
import { Shares } from "../entities/Shares";
import RedditPoster from "./RedditPoster";
import { Guilds } from "../entities/Guilds";
import FMcord from "../handler/FMcord";

async function addRedditInfo(embed: FMcordEmbed | ShareEmbedUpdate, share: Shares, redditConfig: any, embedMessage: Message) {
    let votes = 0;
    if(embedMessage && embedMessage.reactions['🤘']) {
        votes += (embedMessage.reactions['🤘'].count - 1);
    }

    if(share.redditPostLink && share.redditPostId) {
        const redditPoster = new RedditPoster(redditConfig, share.discordGuildID);
        const post = await redditPoster.getPost(share.redditPostId);
        votes += ((post.score as number) - 1);
        share.votes = votes;
        share.save();

        embed.addField(`Reddit Link`, share.redditPostLink);
        embed.addField(`Reddit Comments`, post.num_comments.toString());
    }
    else {
        const client = embedMessage.channel.client as FMcord;
        const prefix = embedMessage.guildID !== null ? client.guildPrefixes[embedMessage.guildID!] ?? client.prefix : client.prefix;
        embed.addField(`Reddit Link`,`Not Posted (admin, type ${prefix}login redditbot)`);
    }

    embed.addField(`Total Votes`, `${votes}`);
    embed.timestamp = new Date();
}

export default class ShareEmbed extends FMcordEmbed {

    private message: Message;
    private share: Shares;

    public constructor(message: Message, command: string, share: Shares) {
        super(message);
        this.message = message;
        this.share = share;
        this.setTitle(share.displayTitle)

        if(command === 'youtube') {
            if(!share.youtubeLink) {
                return;
            }
            this.setURL(share.youtubeLink);
            if(share.spotifyLink) {
                this.addField('Spotify Link', share.spotifyLink);
            }
        }
        else if (command === 'spotify') {
            if(!share.spotifyLink) {
                return;
            }
            this.setURL(share.spotifyLink);
            if(share.youtubeLink) {
                this.addField('YouTube Link', share.youtubeLink);
            }
        }

    }

    // This must be called before returning the embed,
    // to make sure it has up-to-date info.
    public async update(embedMessage: Message) {
        const { guildSettings } = await Guilds.findOneOrFail({discordID: this.message.guildID});
        await addRedditInfo(this, this.share, guildSettings.reddit, embedMessage);
    }
}

export class ShareEmbedUpdate {
    private embed: Embed;
    private embedMessage: Message;
    private share: Shares;
    constructor(oldEmbed: Embed, embedMessage: Message, share: Shares) {
        this.embed = oldEmbed;
        this.embedMessage = embedMessage;
        this.share = share;
    }

    public async update() {
        const { guildSettings } = await Guilds.findOneOrFail({discordID: this.embedMessage.guildID});
        await addRedditInfo(this, this.share, guildSettings.reddit, this.embedMessage);
    }

    public async getEmbed(): Promise<Embed> {
        await this.update();
        return this.embed;
    }

    public addField(name: string, value: string, inline?: boolean) {
        if(!this.embed.fields) {
            this.embed.fields = [];
        }
        let fieldIndex = this.embed.fields.findIndex(field => field.name === name);
        if(fieldIndex !== -1) {
            this.embed.fields[fieldIndex] = { name, value, inline };
        }
        else {
            this.embed.fields.push({ name, value, inline });
        }
        return this.embed;
    }

    public set timestamp(input: Date) {
        this.embed.timestamp = input;
    }

    public get fields() {
        return this.embed.fields;
    }
}
