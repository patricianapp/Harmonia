import { stringify } from "querystring";
import axios from "axios";
import config from '../config';
import { Guilds } from "../entities/Guilds";

const url = `https://oauth.reddit.com/`;

export default class RedditPoster {

    // type credentials once we know for sure what our auth method is
    public constructor(private redditConfig: any, private guildID: string) {
    }

    public async refreshAccessToken() {
        if(Date.parse(new Date().toISOString()) - Date.parse(this.redditConfig.auth.bearerTokenDate) < 3540000) {
            return;
        }

        const result = (await axios.post('https://www.reddit.com/api/v1/access_token', stringify({
            grant_type: 'refresh_token',
            refresh_token: this.redditConfig.auth.refreshToken,
        }), {
            auth: {
                username: config.reddit.clientId,
                password: config.reddit.secret,
            }
        })).data;
        this.redditConfig.auth.bearerToken = result.access_token;
        const guild = await Guilds.findOneOrFail({discordID: this.guildID});
        guild.guildSettings.reddit = this.redditConfig;
        guild.save();
        return result;
    }

    public static async getBearerToken(code: string, redirect_uri: string) {
        const result = (await axios.post('https://www.reddit.com/api/v1/access_token', stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri,
        }), {
            auth: {
                username: config.reddit.clientId,
                password: config.reddit.secret,
            }
        })).data;
        return result;
    }

    // TODO: Type post options
    public async post(options: any, channelName: string) {
        await this.refreshAccessToken();
        let flair_id = await this.getFlairId(options.sr, channelName);
        if(flair_id === undefined) {
            console.log('No flair matches this channel name.');
            if(this.redditConfig.autoFlair) {
                flair_id = await this.addNewFlair(options.sr, channelName);
                console.log(`Flair ${channelName} added.`)
            }
            else {
                console.log('Auto-flair is off. Will not post.')
                return;
            }
        }
        const postId = (await axios.post(`${url}/api/submit`, stringify({
            kind: 'link',
            resubmit: true,
            api_type: 'json',
            flair_id,
            sr: this.redditConfig.subredditName,
            ...options
        }), {
            headers: {
                Authorization: `Bearer ${this.redditConfig.auth.bearerToken}`
            }
        })).data.json.data.id;

        return postId;
    }

    // TODO: type Reddit post
    public async getPost(postId: string): Promise<any> {
        await this.refreshAccessToken();
        const result = (await axios.get(`${url}/r/${this.redditConfig.subredditName}/api/info?id=${postId}`, {
            headers: {
                Authorization: `Bearer ${this.redditConfig.auth.bearerToken}`
            }
        })).data;
        return result.data.children[0].data;
    }

    public async deletePost(postId: string) {
        await this.refreshAccessToken();
        await axios.post(`${url}/api/del`, stringify({
            id: postId
        }), {
            headers: {
                Authorization: `Bearer ${this.redditConfig.auth.bearerToken}`
            }
        });
    }

    // TODO: comment
    public async comment(subredditName: string, postId: string, text: string) {
        await this.refreshAccessToken();
        const res = await axios.post(`${url}/r/${this.redditConfig.subredditName}/api/comment`, stringify({
            api_type: 'json',
            thing_id: postId,
            text
        }), {
            headers: {
                Authorization: `Bearer ${this.redditConfig.auth.bearerToken}`
            }
        });
        console.log(res);
    }

    public async getFlairId(subredditName: string, flairName: string): Promise<string | undefined> {
        const flairs = await this.getSubredditFlairs(this.redditConfig.subredditName);
        return flairs.find(flair => flair.text === flairName)?.id;
    }

    public async getSubredditFlairs(subredditName: string): Promise<Array<any>> { // TODO: Type flair response
        await this.refreshAccessToken();
        try {
            const result = (await axios.get(`${url}/r/${this.redditConfig.subredditName}/api/link_flair_v2`, {
                headers: {
                    Authorization: `Bearer ${this.redditConfig.auth.bearerToken}`
                }
            })).data;
            return result;
        }
        catch(e) {
            console.log(e);
            return [];
        }
    }

    public async addNewFlair(subredditName: string, text: string): Promise<string> {
        await this.refreshAccessToken();
        const res = await axios.post(`${url}/r/${this.redditConfig.subredditName}/api/flairtemplate`, stringify({
            api_type: 'json',
            flair_type: 'LINK_FLAIR',
            text,
        }), {
            headers: {
                Authorization: `Bearer ${this.redditConfig.auth.bearerToken}`
            }
        })
        if(res.status === 200) {
            const flairId = await this.getFlairId(this.redditConfig.subredditName, text);
            if(flairId === undefined) {
                throw `Failed to add flair ${text} to ${this.redditConfig.subredditName}`;
            }
            return flairId;
        }
        throw `Failed to retrieve subreddit flairs`;
    }
}
