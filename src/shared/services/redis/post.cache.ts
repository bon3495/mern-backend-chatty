import { RedisCommandRawReply } from '@redis/client/dist/lib/commands';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import {
  IPostDocument,
  ISavePostToCache,
} from '@post/interfaces/post.interface';
import { BaseCache } from './base.cache';

const log: Logger = config.createLogger('postCache');

export type PostCacheMultiType =
  | string
  | number
  | Buffer
  | RedisCommandRawReply[]
  | IPostDocument
  | IPostDocument[];

export class PostCache extends BaseCache {
  constructor() {
    super('postCache');
  }

  public async savePostToCache({
    key,
    currentUserId,
    uId,
    createdPost,
  }: ISavePostToCache): Promise<void> {
    const {
      _id,
      userId,
      username,
      email,
      avatarColor,
      profilePicture,
      post,
      bgColor,
      commentsCount,
      imgVersion,
      imgId,
      feelings,
      gifUrl,
      privacy,
      reactions,
      createdAt,
    } = createdPost;

    const dataToSave = {
      _id: `${_id}`,
      userId: `${userId}`,
      username: `${username}`,
      email: `${email}`,
      avatarColor: `${avatarColor}`,
      profilePicture: `${profilePicture}`,
      post: `${post}`,
      bgColor: `${bgColor}`,
      feelings: `${feelings}`,
      privacy: `${privacy}`,
      gifUrl: `${gifUrl}`,
      commentsCount: `${commentsCount}`,
      reactions: JSON.stringify(reactions),
      imgVersion: `${imgVersion}`,
      imgId: `${imgId}`,
      createdAt: `${createdAt}`,
    };

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const postCount: string[] = await this.client.HMGET(
        `users:${currentUserId}`,
        'postsCount'
      );

      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.ZADD('post', {
        score: parseInt(uId, 10),
        value: `${key}`,
      });
      for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
        multi.HSET(`posts:${key}`, itemKey, itemValue);
      }

      const updateCount = parseInt(postCount[0], 10) + 1;
      multi.HSET(`users:${currentUserId}`, 'postsCount', updateCount);
      multi.exec();
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getPostsFromCache(
    key: string,
    start: number,
    end: number
  ): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }

      const postIdsList: string[] = await this.client.ZRANGE(key, start, end, {
        REV: true,
      });

      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const postId of postIdsList) {
        multi.HGETALL(`posts:${postId}`);
      }

      const postsListRaw: PostCacheMultiType =
        (await multi.exec()) as PostCacheMultiType;
      const postsList: IPostDocument[] = [];

      for (const postRaw of postsListRaw as IPostDocument[]) {
        postRaw.commentsCount = Helpers.parseJson(`${postRaw.commentsCount}`);
        postRaw.reactions = Helpers.parseJson(`${postRaw.reactions}`);
        postRaw.createdAt = new Date(Helpers.parseJson(`${postRaw.createdAt}`));

        postsList.push(postRaw);
      }

      return postsList;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getTotalPostsInCache(): Promise<number> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }

      const count: number = await this.client.ZCARD('post');

      return count;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getPostsWithImageFromCache(
    key: string,
    start: number,
    end: number
  ): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }

      const postIdsList: string[] = await this.client.ZRANGE(key, start, end, {
        REV: true,
      });

      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const postId of postIdsList) {
        multi.HGETALL(`posts:${postId}`);
      }

      const postsListRaw: PostCacheMultiType =
        (await multi.exec()) as PostCacheMultiType;
      const postsList: IPostDocument[] = [];

      for (const postRaw of postsListRaw as IPostDocument[]) {
        if ((postRaw.imgId && postRaw.imgVersion) || postRaw.gifUrl) {
          postRaw.commentsCount = Helpers.parseJson(`${postRaw.commentsCount}`);
          postRaw.reactions = Helpers.parseJson(`${postRaw.reactions}`);
          postRaw.createdAt = new Date(
            Helpers.parseJson(`${postRaw.createdAt}`)
          );
          postsList.push(postRaw);
        }
      }

      return postsList;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getUserPostsFromCache(
    key: string,
    uId: number
  ): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }

      const postIdsList: string[] = await this.client.ZRANGE(key, uId, uId, {
        REV: true,
        BY: 'SCORE',
      });

      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const postId of postIdsList) {
        multi.HGETALL(`posts:${postId}`);
      }

      const postsListRaw: PostCacheMultiType =
        (await multi.exec()) as PostCacheMultiType;
      const postsList: IPostDocument[] = [];

      for (const postRaw of postsListRaw as IPostDocument[]) {
        postRaw.commentsCount = Helpers.parseJson(`${postRaw.commentsCount}`);
        postRaw.reactions = Helpers.parseJson(`${postRaw.reactions}`);
        postRaw.createdAt = new Date(Helpers.parseJson(`${postRaw.createdAt}`));
        postsList.push(postRaw);
      }

      return postsList;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getTotalUserPostsInCache(uId: number): Promise<number> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }

      const count: number = await this.client.ZCOUNT('post', uId, uId);

      return count;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async deleteFromCache(
    key: string,
    currentUserId: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }

      const postCount: string[] = await this.client.HMGET(
        `users:${currentUserId}`,
        'postsCount'
      );
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.ZREM('post', `${key}`);
      multi.DEL(`posts:${key}`);

      const updateCount = parseInt(postCount[0], 10) - 1;
      multi.HSET(`users:${currentUserId}`, 'postsCount', updateCount);

      await multi.exec();
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async updatePostInCache(
    key: string,
    updatedPost: IPostDocument
  ): Promise<IPostDocument> {
    const {
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      imgVersion,
      imgId,
      profilePicture,
    } = updatedPost;

    const dataToSave = {
      post: `${post}`,
      bgColor: `${bgColor}`,
      feelings: `${feelings}`,
      privacy: `${privacy}`,
      gifUrl: `${gifUrl}`,
      profilePicture: `${profilePicture}`,
      imgVersion: `${imgVersion}`,
      imgId: `${imgId}`,
    };

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
        await this.client.HSET(`posts:${key}`, itemKey, itemValue);
      }
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.HGETALL(`posts:${key}`);
      const reply: PostCacheMultiType =
        (await multi.exec()) as PostCacheMultiType;
      const postReply = reply as IPostDocument[];

      postReply[0].commentsCount = Helpers.parseJson(
        `${postReply[0].commentsCount}`
      );
      postReply[0].reactions = Helpers.parseJson(`${postReply[0].reactions}`);
      postReply[0].createdAt = new Date(
        Helpers.parseJson(`${postReply[0].createdAt}`)
      );

      return postReply[0];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }
}
