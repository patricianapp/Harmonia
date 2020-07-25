import CommandParams from "../../handler/CommandParams";
import { Message } from "eris";
import { Prefixes } from "../../entities/Prefixes";
import FMcord from "../../handler/FMcord";
import NotDisabled from "../../checks/NotDisabled";
import StartTyping from "../../hooks/StartTyping";
import PostCheck from "../../hooks/PostCheck";
import { Guilds } from "../../entities/Guilds";

export default class SetSubcommand extends CommandParams {

    public constructor() {
        super(`set`, {
            argsRequired: true,
            invalidUsageMessage: (message: Message) => `${message.author.mention}, you must provide a prefix!`,
            guildOnly: true,
            requirements: {
                permissions: {
                    manageGuild: true,
                },
                custom: NotDisabled
            },
            permissionMessage: (message: Message) => `${message.author.mention}, you do not have a permission \`Manage Guild\` to execute this command.`,
            hooks: {
                preCommand: StartTyping,
                postCheck: PostCheck
            }
        });
    }

    public async execute(message: Message, args: string[]): Promise<void> {
        const prefix = args[0];
        const client = message.channel.client as FMcord;
        if (prefix.length < 3) {
            const guild = await Guilds.findOneOrFail({discordID: message.guildID});
            guild.guildSettings.prefix = prefix;
            guild.save();
            client.registerGuildPrefix(message.guildID!, prefix);
            await message.channel.createMessage(`${message.author.mention}, prefix in ${message.member!.guild.name} has been set to \`${prefix}\` succesfully!`);
        } else if (prefix.length >= 3) {
            await message.channel.createMessage(`${message.author.mention}, your prefix is too long! It cannot be longer than 2 symbols.`);
        } else if (prefix === client.prefix) {
            await message.channel.createMessage(`${message.author.mention}, you can't have a default prefix as a custom prefix, that's illogical.`);
        }
    }
}
