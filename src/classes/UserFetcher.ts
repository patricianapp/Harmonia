import { Message } from "eris";
import { Users } from "../entities/Users";
import { Modes } from "../entities/Modes";
import NowPlayingMode from "../enums/NowPlayingMode";
import { Guilds } from "../entities/Guilds";

export default class UserFetcher {

    protected readonly message: Message;

    public constructor(message: Message) {
        this.message = message;
    }

    public static async getByID(id: string): Promise<Users | undefined> {
        const user: Users | undefined = await Users.findOne({
            discordUserID: id,
        });
        return user;
    }

    public async getAuthor(): Promise<Users> {
        let author: Users | undefined = await UserFetcher.getByID(this.message.author.id);
        if(!author) {
            const newUser = new Users();
            newUser.discordUserID = this.message.author.id;
            author = await newUser.save();
        }
        return author;
    }

    public async username(): Promise<string | null> {
        const user: Users | undefined = await this.getAuthor();
        if (user && user.lastFMUsername) {
            return user.lastFMUsername;
        } else {
            return null;
        }
    }

    public async usernameFromID(id: string): Promise<string | null> {
        const user: Users | undefined = await UserFetcher.getByID(id);
        if (user && user.lastFMUsername) {
            return user.lastFMUsername;
        } else {
            return null;
        }
    }

    private async guildMode(): Promise<NowPlayingMode | undefined> {
        const guildMode = await Guilds.findOne({
            discordID: this.message.member?.guild.id
        });
        return guildMode?.nowPlayingMode;
    }

    public async mode(): Promise<NowPlayingMode | null> {
        const user = await this.getAuthor();
        if (user !== null) {
            const mode = await Modes.findOne({
                user
            });
            const guildMode = await this.guildMode();
            if (mode !== undefined) {
                if (guildMode) {
                    return Math.max(mode.nowPlayingMode, guildMode);
                } else {
                    return mode.nowPlayingMode;
                }
            } else if (guildMode !== undefined) {
                return guildMode;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    public async modeFromID(id: string): Promise<NowPlayingMode | null> {
        const user = await UserFetcher.getByID(id);
        if (user !== null) {
            const mode = await Modes.findOne({
                user
            });
            const guildMode = await this.guildMode();
            if (mode !== undefined) {
                if (guildMode !== undefined) {
                    return Math.max(mode.nowPlayingMode, guildMode);
                } else {
                    return mode.nowPlayingMode;
                }
            } else if (guildMode !== undefined) {
                return guildMode;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

}
