import FMcord from "../handler/FMcord";
import { Guild } from "eris";
import AddGuild from "../utils/AddGuild";

export default (client: FMcord, guild: Guild): void => {
    AddGuild(guild.id);
    client.editStatus(`online`, {
        type: 0,
        name: `with ${client.guilds.size} servers | Do ${client.prefix}help!`
    });
};
