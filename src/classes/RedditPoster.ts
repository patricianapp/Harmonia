import { stringify } from "querystring";
import https from "https";
import axios from "axios";

const url = `https://oauth.reddit.com/`;


export default class RedditPoster {

    private readonly username: string;
    private readonly password: string;
    private readonly clientKey: string;
    private readonly secret: string;
    private readonly subredditName: string;

    private accessToken: string;

    // type credentials once we know for sure what our auth method is
    public constructor(credentials: any) {
      this.username = credentials.username;
      this.password = credentials.password;
      this.clientKey = credentials.clientKey;
      this.secret = credentials.secret;
      this.subredditName = credentials.subredditName;
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
        const flair = 'metal'; // replace with options.flair_text
        const autoFlair = true;
        const flairs = await this.getSubredditFlairs(options.sr);
        console.log(flairs);
        let flair_id = flairs.find(flair => flair.text === channelName)?.id;
        if(!flair_id) {
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
        })).data.json.data.name;
        return postId;
    }

    public async getFlairId(subredditName: string, flairName: string): Promise<string> {
        const flairs = await this.getSubredditFlairs(subredditName);
        const flairId = flairs.find(flair => flair.text === flairName)?.id;
        if(flairId) {
            return flairId;
        }
        else {
            throw `Flair ${flairName} not found in ${subredditName}`;
        }
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

    public async addNewFlair(subredditName: string, text: string) {
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
            const flairs = await this.getSubredditFlairs(subredditName);
            const flairId = flairs.find(flair => flair.text === text)?.id;
            console.log(flairId);
            return flairId;
        }
        throw `Failed to add flair ${text} to ${subredditName}`;
    }

    // public search(query: string): Promise<SearchResult> {
    //     const params = stringify({
    //         key: this.apikey,
    //         q: query,
    //         part: `snippet`,
    //         type: `video`
    //     });
    //     return new Promise<SearchResult>((resolve, reject) => {
    //         https.get(`${url}/search?${params}`, res => {
    //             const contentType = res.headers[`content-type`] as string;
    //             if (res.statusCode !== 200) {
    //                 reject(new Error(`Request failed. Status code: ${res.statusCode}`));
    //             } else if (!contentType.includes(`application/json`)) {
    //                 reject(new Error(`Expected application/json but got ${contentType}`));
    //             }
    //             let rawData = ``;
    //             res.on(`data`, chunk => rawData += chunk);
    //             res.on(`end`, () => {
    //                 try {
    //                     const data: SearchResult = JSON.parse(rawData);
    //                     resolve(data);
    //                 } catch (e) {
    //                     reject(e);
    //                 }
    //             });
    //         }).on(`error`, reject);
    //     });
    // }

    // public getVideo(id: string) {
    //     const params = stringify({
    //         key: this.apikey,
    //         id,
    //         part: `snippet,id`,
    //     });
    //     return new Promise<SearchResult>((resolve, reject) => {
    //         https.get(`${url}/videos?${params}`, res => {
    //             const contentType = res.headers[`content-type`] as string;
    //             if (res.statusCode !== 200) {
    //                 reject(new Error(`Request failed. Status code: ${res.statusCode}`));
    //             } else if (!contentType.includes(`application/json`)) {
    //                 reject(new Error(`Expected application/json but got ${contentType}`));
    //             }
    //             let rawData = ``;
    //             res.on(`data`, chunk => rawData += chunk);
    //             res.on(`end`, () => {
    //                 try {
    //                     const data: SearchResult = JSON.parse(rawData);
    //                     resolve(data);
    //                 } catch (e) {
    //                     reject(e);
    //                 }
    //             });
    //         }).on(`error`, reject);
    //     });
    // }

}
