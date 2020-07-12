import FMcordEmbed from "./FMcordEmbed";
import { Message, Command, Embed } from "eris";
import { Shares } from "../entities/Shares";
import RedditPoster from "./RedditPoster";
import config from "../config";

async function addRedditInfo(embed: FMcordEmbed | ShareEmbedUpdate, share: Shares, embedMessage?: Message) {
    if(share.redditPostLink && share.redditPostId) {
        const redditPoster = new RedditPoster(config.reddit);
        const post = await redditPoster.getPost(share.redditPostLink);
        let votes = post.score;
        if(embedMessage && embedMessage.reactions['🤘']) {
            votes += (embedMessage.reactions['🤘'].count - 1);
        }
        share.votes = votes;
        share.save();

        embed.addField(`Total Votes`, votes);
        embed.addField(`Reddit Link`, share.redditPostLink);
        embed.addField(`Reddit Comments`, post.num_comments.toString());
        embed.timestamp = new Date();
    }
}

export default class ShareEmbed extends FMcordEmbed {

    private share: Shares;
    private embedMessage?: Message;

    public constructor(message: Message, link: string, share: Shares) {
        super(message);
        this.share = share;

        this.setTitle(share.displayTitle)
            .setURL(link);
    }

    // This must be called before returning the embed,
    // to make sure it has up-to-date info.
    public async update(embedMessage?: Message) {
        if(embedMessage) {
            this.embedMessage = embedMessage;
        }
        await addRedditInfo(this, this.share, this.embedMessage);
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
        await addRedditInfo(this, this.share, this.embedMessage);
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
