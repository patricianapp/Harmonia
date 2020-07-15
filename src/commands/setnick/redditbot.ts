import CommandParams from "../../handler/CommandParams";
import StartTyping from "../../hooks/StartTyping";
import PostCheck from "../../hooks/PostCheck";
import { Message } from "eris";
import OwnerOnly from "../../checks/OwnerOnly";
import { Guilds } from "../../entities/Guilds";
import RedditPoster from "../../classes/RedditPoster";
import { RedditAuthRequests } from "../../entities/RedditAuthRequests";
import config from '../../config';

export default class RedditBotSubcommand extends CommandParams {

    public constructor() {
        super(`redditbot`, {
            hooks: {
                preCommand: StartTyping,
                postCheck: PostCheck
            },
            requirements: {
                custom: OwnerOnly
            },
            aliases: [`r`],
        });
    }

    public async execute(message: Message, args: string[]): Promise<void> {
        if(!args[0]) {
            let redditAuthRequest = await RedditAuthRequests.createQueryBuilder('reddit_auth_requests')
            .leftJoinAndSelect('reddit_auth_requests.guild', 'guild')
            .where('guild.discordID = :id', {id: message.guildID})
            .getOne();

            if(!redditAuthRequest) {
                redditAuthRequest = new RedditAuthRequests();
                redditAuthRequest.guild = await Guilds.findOneOrFail({discordID: message.guildID});
                console.log('!redditAuthRequest');
            }

            redditAuthRequest.discordUserID = message.author.id;
            redditAuthRequest.discordMessageID = message.id;
            redditAuthRequest.guild.guildSettings.reddit.auth = { authorizationId: message.id };
            console.log(redditAuthRequest.guild.guildSettings.reddit.auth.authorizationId);
            redditAuthRequest.guild.save();
            redditAuthRequest.save();

            const authLink = `https://www.reddit.com/api/v1/authorize?client_id=${config.reddit.clientId}&response_type=code&` +
            `state=${message.id}&redirect_uri=${config.reddit.redirect}&duration=permanent&scope=flair%20modflair%20read%20submit`;

            (await message.author.getDMChannel()).createMessage(`First, make sure you are logged into your bot account on Reddit.\nThen, click this link to authorize Harmonia: ${authLink}`);
            await message.channel.createMessage(`<@${message.author.id}>, check your DMs!`);
        }
        else {
            if(args[1] && args[2]) {
                let redditAuthRequest = await RedditAuthRequests.findOne({where: {discordUserID: message.author.id}, relations: ['guild']});
                if(!redditAuthRequest) {
                    await message.channel.createMessage('No auth request found. Please type `$login redditbot` to start the authorization process.');
                    return;
                }
                const [authTokenCode, authorizationId, subredditName] = args;
                if(redditAuthRequest.guild.guildSettings.reddit.auth?.authorizationId === authorizationId) {
                    const { access_token, refresh_token } = await RedditPoster.getBearerToken(authTokenCode, config.reddit.redirect);
                    redditAuthRequest.guild.guildSettings.reddit.auth = {
                        bearerToken: access_token,
                        refreshToken: refresh_token,
                        bearerTokenDate: new Date(),
                    };
                    console.log(redditAuthRequest.guild.guildSettings.reddit.auth);
                    redditAuthRequest.guild.guildSettings.reddit.subredditName = subredditName;
                    await redditAuthRequest.guild.save();
                    // await redditAuthRequest.save();
                    await message.channel.createMessage('Reddit authorization successful.');
                }
                else {
                    await message.channel.createMessage('Invalid state ID. Try copying and pasting again, or start over with `$login redditbot`.');
                }
            }
            else {
                await message.channel.createMessage('Missing arguments. Try copying and pasting again.');
            }// $login redditbot <authTokenCode> <state>
        }



}
}
