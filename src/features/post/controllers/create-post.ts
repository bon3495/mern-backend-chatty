import { UploadApiResponse } from 'cloudinary';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { uploads } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';
import { postQueue } from '@service/queues/post.queue';
import { PostCache } from '@service/redis/post.cache';
import { socketIOPostObject } from '@socket/post.socket';
import { IPostDocument } from '@post/interfaces/post.interface';
import { postSchema, postWithImageSchema } from '@post/schemas/post.schemes';

const postCache: PostCache = new PostCache();

export class CreatePost {
  @joiValidation(postSchema)
  public async normal(req: Request, res: Response): Promise<void> {
    const { post, bgColor, feelings, gifUrl, privacy, profilePicture } =
      req.body;
    const postObjectId: ObjectId = new ObjectId();

    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser?.userId,
      username: req.currentUser?.username,
      email: req.currentUser?.email,
      avatarColor: req.currentUser?.avatarColor,
      post,
      bgColor,
      commentsCount: 0,
      imgVersion: '',
      imgId: '',
      feelings,
      gifUrl,
      privacy,
      profilePicture,
      reactions: {
        angry: 0,
        love: 0,
        like: 0,
        haha: 0,
        sad: 0,
        wow: 0,
      },
      createdAt: new Date(),
    } as IPostDocument;

    // Socket
    socketIOPostObject.emit('add post', createdPost);

    // Add Post to Redis
    postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser?.userId}`,
      uId: `${req.currentUser?.uId}`,
      createdPost,
    });

    // Add Post to DB
    postQueue.addPostJob('savePostToDB', {
      value: createdPost,
      key: req.currentUser?.userId,
    });

    res.status(HTTP_STATUS.CREATED).json({
      message: 'Post created successfully',
    });
  }

  @joiValidation(postWithImageSchema)
  public async withImage(req: Request, res: Response): Promise<void> {
    const { post, bgColor, feelings, gifUrl, privacy, profilePicture, image } =
      req.body;

    const resultUpload: UploadApiResponse = (await uploads(
      image
    )) as UploadApiResponse;
    if (!resultUpload.public_id) {
      throw new BadRequestError(resultUpload.message);
    }

    const postObjectId: ObjectId = new ObjectId();

    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser?.userId,
      username: req.currentUser?.username,
      email: req.currentUser?.email,
      avatarColor: req.currentUser?.avatarColor,
      post,
      bgColor,
      commentsCount: 0,
      imgVersion: resultUpload.version.toString(),
      imgId: resultUpload.public_id,
      feelings,
      gifUrl,
      privacy,
      profilePicture,
      reactions: {
        angry: 0,
        love: 0,
        like: 0,
        haha: 0,
        sad: 0,
        wow: 0,
      },
      createdAt: new Date(),
    } as IPostDocument;
    // Socket
    socketIOPostObject.emit('add post', createdPost);

    // Add Post to Redis
    postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser?.userId}`,
      uId: `${req.currentUser?.uId}`,
      createdPost,
    });

    // Add Post to DB
    postQueue.addPostJob('savePostToDB', {
      value: createdPost,
      key: req.currentUser?.userId,
    });

    // Call image queue to add image to mongodb database - comming soon...

    res.status(HTTP_STATUS.CREATED).json({
      message: 'Post created with image successfully',
    });
  }
}
