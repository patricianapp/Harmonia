import CommandParams from "../handler/CommandParams";
import { Message } from "eris";
import StartTyping from "../hooks/StartTyping";
import { Disables } from "../entities/Disables";
import FMcord from "../handler/FMcord";
import { Guilds } from "../entities/Guilds";
import { setSetting } from '../utils/setSetting';

export default class SettingsCommand extends CommandParams {

    public constructor() {
        super(`set`, {
            aliases: [`settings`],
            description: `Set values for guild settings.`,
            usage: [`settings <setting> <value>`].join(`, `),
            fullDescription: `This command requires Manage Server permission. Can be overriden ` +
            `if you have Administrator permissions, or if you are an owner of the guild.`,
            requirements: {
                permissions: {
                    manageGuild: true,
                }
            },
            permissionMessage: (message: Message) => `${message.author.mention}, you do not have a \`Manage Guild\` permission to run this command.`,
            argsRequired: true,
            invalidUsageMessage: (message: Message) => `${message.author.mention}, please specify a setting to change!`,
            hooks: {
                preCommand: StartTyping
            },
            guildOnly: true
        });
    }

    public async execute(message: Message, args: string[]): Promise<void> {
        const guild = await Guilds.findOne({discordID: message.guildID});
        if(!guild) {
            message.channel.createMessage('You need to run this command inside a server.');
            return;
        }
        if(args.length < 2) {
            const client = message.channel.client as FMcord;
            const prefix = message.guildID !== null ? client.guildPrefixes[message.guildID!] ?? client.prefix : client.prefix;
            message.channel.createMessage(`Invalid usage. Type ${prefix}settings <setting> <value>`);
        }

        if(args[0] in setSetting) {
            const success = setSetting[args[0]](guild.guildSettings, args[1]);
            if(success) {
                guild.save();
                message.channel.createMessage(`${args[0]} set to ${args[1]}`);
            }
            else {
                message.channel.createMessage(`Could not set ${args[0]} to ${args[1]}`);
            }
        }
        else {
            message.channel.createMessage(`${args[0]} is not a valid setting`);
        }
    }
}
