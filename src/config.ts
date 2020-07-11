import * as dotenv from 'dotenv';
dotenv.config();

export default {
    prefix: process.env.BOT_PREFIX || '&',
    lastFM: {
        apikey: process.env.LASTFM_API_KEY || '',
    },
    youtube: {
        apikey: process.env.YOUTUBE_API_KEY || '',
    },
    spotify: {
        id: process.env.SPOTIFY_API_KEY || '',
        secret: process.env.SPOTIFY_API_SECRET || '',
    },
    reddit: { // TODO: Store these per-guild or use different auth method
        // permissions: edit, flair, submit
        username: process.env.REDDIT_BOT_USERNAME || '',
        password: process.env.REDDIT_BOT_PASSWORD || '',
        clientKey: process.env.REDDIT_API_CLIENT_KEY || '',
        secret: process.env.REDDIT_API_SECRET || '',
        subredditName: process.env.REDDIT_SUBREDDIT_NAME || ''
    },
    ownerID: process.env.BOT_OWNER_ID || '',
    token: process.env.DISCORD_API_TOKEN || '',
};
