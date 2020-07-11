import { stringify } from "querystring";
import https from "https";
import axios from "axios";

const url = `https://oauth.reddit.com/api`;


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

    public async post(options = {
        title: 'test',
        url: 'https://google.com',
        sr: this.subredditName,
    }) {
        await this.refreshAccessToken() // TODO: Timeout
        const postId = (await axios.post(`${url}/submit`, stringify({
            kind: 'link',
            resubmit: true,
            api_type: 'json',
            ...options
        }), {
            headers: {
                Authorization: `Bearer ${this.accessToken}`
            }
        })).data.json.data.name;
        return postId;
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
