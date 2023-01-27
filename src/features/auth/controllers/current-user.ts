import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { userService } from '@service/db/user.service';
import { UserCache } from '@service/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';

const userCache: UserCache = new UserCache();

export class CurrentUser {
  public async read(req: Request, res: Response): Promise<void> {
    let isUser = false;
    let token = '';
    let user = null;

    const cacheUser: IUserDocument = (await userCache.getUserFromCache(
      `${req.currentUser?.userId}`
    )) as IUserDocument;
    const existingUser: IUserDocument = cacheUser
      ? cacheUser
      : await userService.getUserById(`${req.currentUser?.userId}`);

    if (Object.keys(existingUser).length > 0) {
      isUser = true;
      token = req.session?.jwt;
      user = existingUser;
    }

    res.status(HTTP_STATUS.OK).json({
      isUser,
      token,
      user,
    });
  }
}
