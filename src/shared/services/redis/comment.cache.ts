import Logger from 'bunyan';
import { find } from 'lodash';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import {
  ICommentDocument,
  ICommentNameList,
} from '@comment/interfaces/comment.interface';
import { BaseCache } from './base.cache';

const log: Logger = config.createLogger('commentCache');

export class CommentCache extends BaseCache {
  constructor() {
    super('commentCache');
  }

  public async savePostCommentsToCache({
    postId,
    postCommentsData,
  }: {
    postId: string;
    postCommentsData: string;
  }): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      await this.client.LPUSH(`comments:${postId}`, postCommentsData);
      const commentsCount: string[] = await this.client.HMGET(
        `posts:${postId}`,
        'commentsCount'
      );

      const count: number = (Helpers.parseJson(commentsCount[0]) as number) + 1;

      const dataToSave: { commentsCount: string } = {
        commentsCount: `${count}`,
      };

      for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
        await this.client.HSET(`posts:${postId}`, itemKey, itemValue);
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getCommentsFromCache({
    postId,
  }: {
    postId: string;
  }): Promise<ICommentDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const reply: string[] = await this.client.LRANGE(
        `comments:${postId}`,
        0,
        -1
      );
      const commentsList: ICommentDocument[] = [];

      for (const item of reply) {
        commentsList.push(Helpers.parseJson(item));
      }

      return commentsList;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getCommentsNamesFromCache({
    postId,
  }: {
    postId: string;
  }): Promise<ICommentNameList[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const commentsCount: number = await this.client.LLEN(
        `comments:${postId}`
      );

      const comments: string[] = await this.client.LRANGE(
        `comments:${postId}`,
        0,
        -1
      );
      const commentsNamesList: string[] = [];

      for (const item of comments) {
        const itemAfterParse = Helpers.parseJson(item) as ICommentDocument;
        commentsNamesList.push(itemAfterParse.username);
      }

      const response: ICommentNameList = {
        count: commentsCount,
        names: commentsNamesList,
      };

      return [response];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getSingleCommentFromCache({
    postId,
    commentId,
  }: {
    postId: string;
    commentId: string;
  }): Promise<ICommentDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const comments: string[] = await this.client.LRANGE(
        `comments:${postId}`,
        0,
        -1
      );
      const list: ICommentDocument[] = [];

      for (const item of comments) {
        const itemAfterParse = Helpers.parseJson(item) as ICommentDocument;
        list.push(itemAfterParse);
      }

      const result = find(
        list,
        item => item._id === commentId
      ) as ICommentDocument;

      return [result];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }
}
