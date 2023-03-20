import Logger from 'bunyan';
import { find } from 'lodash';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import {
  IReactionDocument,
  IReactions,
} from '@reaction/interfaces/reaction.interface';
import { BaseCache } from './base.cache';

const log: Logger = config.createLogger('reactionCache');

interface ISavePostReactToCache {
  key: string;
  reaction: IReactionDocument;
  postReactions: IReactions;
  type?: string;
  previousReaction?: string;
}

interface IRemovePostReactFromCache {
  key: string;
  postReactions: IReactions;
  username: string;
}

export class ReactionCache extends BaseCache {
  constructor() {
    super('reactionCache');
  }

  public async savePostReactionToCache({
    key,
    reaction,
    postReactions,
    type,
    previousReaction,
  }: ISavePostReactToCache): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      if (previousReaction) {
        // call remove reaction method
        await this.removePostReactionFromCache({
          key,
          username: reaction.username,
          postReactions,
        });
      }

      if (type) {
        await this.client.LPUSH(`reactions:${key}`, JSON.stringify(reaction));
        const dataToSave = {
          reactions: JSON.stringify(postReactions),
        };
        for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
          await this.client.HSET(`posts:${key}`, itemKey, itemValue);
        }
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async removePostReactionFromCache({
    key,
    username,
    postReactions,
  }: IRemovePostReactFromCache): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const response: string[] = await this.client.LRANGE(
        `reactions:${key}`,
        0,
        -1
      );
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      const userpreviousReaction: IReactionDocument =
        (await this.getpreviousReaction(
          response,
          username
        )) as IReactionDocument;
      multi.LREM(`reactions:${key}`, 1, JSON.stringify(userpreviousReaction));
      await multi.exec();

      const dataToSave = {
        reactions: JSON.stringify(postReactions),
      };
      for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
        await this.client.HSET(`posts:${key}`, itemKey, itemValue);
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getReactionsFromCache({
    postId,
  }: {
    postId: string;
  }): Promise<[IReactionDocument[], number]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const reactionsCount: number = await this.client.LLEN(
        `reactions:${postId}`
      );
      const response: string[] = await this.client.LRANGE(
        `reactions:${postId}`,
        0,
        -1
      );
      const listReactions: IReactionDocument[] = [];
      for (const item of response) {
        listReactions.push(Helpers.parseJson(item));
      }

      return response.length > 0 ? [listReactions, reactionsCount] : [[], 0];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getSingleReactionByUsernameFromCache({
    postId,
    username,
  }: {
    postId: string;
    username: string;
  }): Promise<[IReactionDocument, number] | []> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const response: string[] = await this.client.LRANGE(
        `reactions:${postId}`,
        0,
        -1
      );
      const listReactions: IReactionDocument[] = [];
      for (const item of response) {
        listReactions.push(Helpers.parseJson(item));
      }

      const result: IReactionDocument | undefined = find(
        listReactions,
        (item: IReactionDocument) => {
          return (
            item.postId === postId &&
            item.username.toLowerCase() === username.toLowerCase()
          );
        }
      );

      return result ? [result, 1] : [];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  private async getpreviousReaction(
    response: string[],
    username: string
  ): Promise<IReactionDocument | undefined> {
    const list: IReactionDocument[] = [];
    for (const item of response) {
      list.push(Helpers.parseJson(`${item}`) as IReactionDocument);
    }

    return find(list, (listItem: IReactionDocument) => {
      return listItem.username === username;
    });
  }
}
