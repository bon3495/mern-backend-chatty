import { UploadApiResponse } from 'cloudinary';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import JWT from 'jsonwebtoken';
import { omit } from 'lodash';
import { ObjectId } from 'mongodb';

import { config } from '@root/config';

import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { uploads } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';

import { IAuthDocument, ISignUpData } from '@auth/interfaces/auth.interface';
import { signupSchema } from '@auth/schemas/signup';

import { authService } from '@service/db/auth.service';
import { authQueue } from '@service/queues/auth.queue';
import { userQueue } from '@service/queues/user.queue';
import { UserCache } from '@service/redis/user.cache';

import { IUserDocument } from '@user/interfaces/user.interface';

const userCache: UserCache = new UserCache();

export class SignUp {
  @joiValidation(signupSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { username, password, email, avatarColor, avatarImage } = req.body;
    const checkIfUserExist: IAuthDocument =
      await authService.getUserByUsernameOrEmail(username, email);

    if (checkIfUserExist) {
      throw new BadRequestError('Invalid credentials');
    }

    const authObjectId: ObjectId = new ObjectId();
    const userObjectId: ObjectId = new ObjectId();
    const uId = `${Helpers.generateRandomIntegers(12)}`;
    // Cannot call this.signupData(), call SignUp.prototype.signupData() instead.
    const authData: IAuthDocument = SignUp.prototype.signupData({
      _id: authObjectId,
      uId,
      username,
      password,
      email,
      avatarColor,
    });

    const resultUpload: UploadApiResponse = (await uploads(
      avatarImage,
      `${userObjectId}`,
      true,
      true
    )) as UploadApiResponse;

    // If has error it will not return any public_id
    if (!resultUpload.public_id) {
      throw new BadRequestError('File upload: Error occurred.Try again');
    }

    // Add user to redis cache
    const userDataForCache: IUserDocument = SignUp.prototype.userData(
      authData,
      userObjectId
    );
    userDataForCache.profilePicture = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload/v${resultUpload.version}/${userObjectId}`;

    await userCache.saveUserToCache(`${userObjectId}`, uId, userDataForCache);

    // Add to database
    const newUserDataForCache = omit(userDataForCache, [
      'uId',
      'username',
      'email',
      'password',
      'avatarColor',
    ]);

    authQueue.addAuthUserJob('addAuthUserToDB', { value: authData });
    userQueue.addUserJob('addUserToDB', { value: newUserDataForCache });

    const userJwt: string = SignUp.prototype.signToken(authData, userObjectId);
    req.session = { jwt: userJwt };

    res.status(HTTP_STATUS.CREATED).json({
      message: 'User created successfully',
      user: userDataForCache,
      token: userJwt,
    });
  }

  private signToken(data: IAuthDocument, userObjectId: ObjectId): string {
    return JWT.sign(
      {
        userId: userObjectId,
        uId: data.uId,
        email: data.email,
        username: data.username,
        avatarColor: data.avatarColor,
      },
      config.JWT_TOKEN!
    );
  }

  private signupData(data: ISignUpData): IAuthDocument {
    const { _id, avatarColor, email, password, uId, username } = data;
    return {
      _id,
      uId,
      email: Helpers.lowerCase(email),
      username: Helpers.firstLetterUppercase(username),
      avatarColor,
      password,
      createdAt: new Date(),
    } as IAuthDocument;
  }

  private userData(data: IAuthDocument, userObjectId: ObjectId): IUserDocument {
    const { _id, uId, username, email, avatarColor, password } = data;

    return {
      _id: userObjectId,
      authId: _id,
      uId,
      username: Helpers.firstLetterUppercase(username),
      email,
      password,
      avatarColor,
      profilePicture: '',
      blocked: [],
      blockedBy: [],
      work: '',
      location: '',
      school: '',
      quote: '',
      bgImageVersion: '',
      bgImageId: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      notifications: {
        messages: true,
        reactions: true,
        comments: true,
        follows: true,
      },
      social: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
      },
    } as unknown as IUserDocument;
  }
}
