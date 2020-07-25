import { GuildSettings } from "../entities/Guilds";
import { get, set } from 'lodash';

export const setSetting: {[path: string]: (settings: GuildSettings, value: string) => boolean} = {};

const stringSettings = [
    'prefix',
    'reddit.auth.bearerToken',
    'reddit.auth.refreshToken',
    'reddit.subredditName',
    'leaderboard.channelName',
    'spotify.auth.bearerToken',
    'spotify.auth.refreshToken',
    'spotify.playlist.enable',
    'spotify.playlist.playlistId',
    'spotify.playlist.albumPlaylistId',
];

const numberSettings = [
    'timeZoneOffset',
    'leaderboard.frequency',
    'leaderboard.weekResetDay',
    'leaderboard.resetHour',
    'spotify.playlist.amountOfTracks',
    'spotify.playlist.amountOfAlbums',

];

const booleanSettings = [
    'reddit.autoFlair',
    'leaderboard.enable',
    'spotify.playlist.enable',
    'spotify.playlist.enableMinTracks',
]

booleanSettings.forEach(path => {
    setSetting[path] = (settings: GuildSettings, value: string) => {
        set(settings, path, value === 'true');
        return get(settings, path) === (value === 'true');
    }
});

numberSettings.forEach(path => {
    setSetting[path] = (settings: GuildSettings, value: string) => {
        set(settings, path, Number(value));
        return get(settings, path) === (Number(value));
    }
});

stringSettings.forEach(path => {
    setSetting[path] = (settings: GuildSettings, value: string) => {
        set(settings, path, value);
        return get(settings, path) === value;
    }
});
