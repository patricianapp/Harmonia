import CommandParams from "../handler/CommandParams";
import StartTyping from "../hooks/StartTyping";
import PostCheck from "../hooks/PostCheck";
import { Message } from "eris";
import NotDisabled from "../checks/NotDisabled";
import { Shares } from "../entities/Shares";
import { MoreThan } from 'typeorm';
import RedditPoster from "../classes/RedditPoster";
import config from "../config";
import UserFetcher from "../classes/UserFetcher";

export default class ListCommand extends CommandParams {

    public constructor() {
        super(`delete`, {
            description: `Delete your most recent song/album share, including the Reddit post.`,
            usage: [
                `delete`,
            ].join(`, `),
            requirements: {
                custom: NotDisabled,
            },
            hooks: {
                preCommand: StartTyping,
                postCheck: PostCheck
            },
        });
    }

    public async execute(message: Message, args: string[]): Promise<void> {
        const share = await Shares.createQueryBuilder('shares')
        .leftJoinAndSelect('shares.user', 'user')
        .where('user.discordUserID = :id', {id: message.author.id})
        .orderBy('datePosted', 'DESC')
        .getOne();
      if(share) {
        message.channel.deleteMessage(share.discordRequestMessageID);
        message.channel.deleteMessage(share.discordLinkMessageID);
        if(share.discordInfoMessageID) {
          message.channel.deleteMessage(share.discordInfoMessageID);
        }
        message.channel.deleteMessage(message.id);

        if(share.redditPostId) {
          const redditPoster = new RedditPoster(config.reddit, share.discordGuildID);
          await redditPoster.deletePost(share.redditPostId);
        }

        await Shares.remove(share);
        return;
      }
      else {
        message.channel.createMessage('You have not shared anything yet.')
      }
    }
}
