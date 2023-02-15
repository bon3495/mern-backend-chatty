import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import { IUserDocument } from '@user/interfaces/user.interface';
import { BaseCache } from './base.cache';

const log: Logger = config.createLogger('userCache');

export class UserCache extends BaseCache {
  constructor() {
    super('userCache');
  }

  public async saveUserToCache(
    key: string,
    userUID: string,
    createdUser: IUserDocument
  ): Promise<void> {
    const createdAt = new Date();
    const {
      _id,
      uId,
      username,
      email,
      avatarColor,
      blocked,
      blockedBy,
      postsCount,
      profilePicture,
      followersCount,
      followingCount,
      notifications,
      work,
      location,
      school,
      quote,
      bgImageVersion,
      bgImageId,
      social,
    } = createdUser;

    const firstList: string[] = [
      '_id',
      `${_id}`,
      'uId',
      `${uId}`,
      'username',
      `${username}`,
      'email',
      `${email}`,
      'avatarColor',
      `${avatarColor}`,
      'createdAt',
      `${createdAt}`,
      'postsCount',
      `${postsCount}`,
    ];

    const secondList: string[] = [
      'blocked',
      JSON.stringify(blocked),
      'blockedBy',
      JSON.stringify(blockedBy),
      'profilePicture',
      `${profilePicture}`,
      'followersCount',
      `${followersCount}`,
      'followingCount',
      `${followingCount}`,
      'notifications',
      JSON.stringify(notifications),
      'social',
      JSON.stringify(social),
    ];

    const thirdList: string[] = [
      'work',
      `${work}`,
      'location',
      `${location}`,
      'school',
      `${school}`,
      'quote',
      `${quote}`,
      'bgImageVersion',
      `${bgImageVersion}`,
      'bgImageId',
      `${bgImageId}`,
    ];

    const dataToSave: string[] = [...firstList, ...secondList, ...thirdList];
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      await this.client.ZADD('user', {
        score: parseInt(userUID, 10),
        value: `${key}`,
      });

      await this.client.HSET(`users:${key}`, dataToSave);
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }

  public async getUserFromCache(userId: string): Promise<IUserDocument | null> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const userFromCache: IUserDocument = (await this.client.HGETALL(
        `users:${userId}`
      )) as unknown as IUserDocument;

      userFromCache.createdAt = new Date(
        Helpers.parseJson(`${userFromCache.createdAt}`)
      );
      userFromCache.postsCount = Helpers.parseJson(
        `${userFromCache.postsCount}`
      );
      userFromCache.blocked = Helpers.parseJson(`${userFromCache.blocked}`);
      userFromCache.blockedBy = Helpers.parseJson(`${userFromCache.blockedBy}`);
      userFromCache.notifications = Helpers.parseJson(
        `${userFromCache.notifications}`
      );
      userFromCache.social = Helpers.parseJson(`${userFromCache.social}`);
      userFromCache.followersCount = Helpers.parseJson(
        `${userFromCache.followersCount}`
      );
      userFromCache.followingCount = Helpers.parseJson(
        `${userFromCache.followingCount}`
      );

      return userFromCache;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again');
    }
  }
}
