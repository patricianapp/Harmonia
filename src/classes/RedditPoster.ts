import { stringify } from "querystring";
import https from "https";
import axios from "axios";

const url = `https://oauth.reddit.com/`;


export default class RedditPoster {

    private readonly username: string;
    private readonly password: string;
    private readonly clientKey: string;
    private readonly secret: string;

    private accessToken: string;

    // type credentials once we know for sure what our auth method is
    public constructor(credentials: any) {
      this.username = credentials.username;
      this.password = credentials.password;
      this.clientKey = credentials.clientKey;
      this.secret = credentials.secret;
      this.accessToken = '';
    }

    public async refreshAccessToken() {
        this.accessToken = (await axios.post('https://www.reddit.com/api/v1/access_token', stringify({
            grant_type: 'password',
            username: this.username,
            password: this.password,
        }), {
            auth: {
                username: this.clientKey,
                password: this.secret
            }
        })).data.access_token;
    }

    // TODO: Type post options
    public async post(options: any, channelName: string) {
        await this.refreshAccessToken() // TODO: Timeout
        const autoFlair = true;
        let flair_id = await this.getFlairId(options.sr, channelName);
        if(flair_id === undefined) {
            if(autoFlair) {
                flair_id = await this.addNewFlair(options.sr, channelName);
            }
            else {
                console.log('No flair matches this channel name. Will not post.')
                return;
            }
        }
        const postId = (await axios.post(`${url}/api/submit`, stringify({
            kind: 'link',
            resubmit: true,
            api_type: 'json',
            flair_id,
            ...options
        }), {
            headers: {
                Authorization: `Bearer ${this.accessToken}`
            }
        })).data.json.data.id;
        return postId;
    }

    public async getFlairId(subredditName: string, flairName: string): Promise<string | undefined> {
        const flairs = await this.getSubredditFlairs(subredditName);
        return flairs.find(flair => flair.text === flairName)?.id;
    }

    public async getSubredditFlairs(subredditName: string): Promise<Array<any>> { // TODO: Type flair response
        try {
            const result = (await axios.get(`${url}/r/${subredditName}/api/link_flair_v2`, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
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
        const res = await axios.post(`${url}/r/${subredditName}/api/flairtemplate`, stringify({
            api_type: 'json',
            flair_type: 'LINK_FLAIR',
            text,
        }), {
            headers: {
                Authorization: `Bearer ${this.accessToken}`
            }
        })
        if(res.status === 200) {
            const flairId = await this.getFlairId(subredditName, text);
            if(flairId === undefined) {
                throw `Failed to add flair ${text} to ${subredditName}`;
            }
            return flairId;
        }
        throw `Failed to retrieve subreddit flairs`;
    }
}
