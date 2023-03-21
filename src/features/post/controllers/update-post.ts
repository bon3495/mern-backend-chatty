import { UploadApiResponse } from 'cloudinary';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { uploads } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';
import { postQueue } from '@service/queues/post.queue';
import { PostCache } from '@service/redis/post.cache';
import { socketIOPostObject } from '@socket/post.socket';
import { IPostDocument } from '@post/interfaces/post.interface';
import { postSchema } from '@post/schemas/post.schema';

const postCache: PostCache = new PostCache();

export class UpdatePost {
  @joiValidation(postSchema)
  public async normal(req: Request, res: Response): Promise<void> {
    // const newPostUpdated: IPostDocument =
    await UpdatePost.prototype.updatePostWithImage(req);

    res.status(HTTP_STATUS.OK).json({
      message: 'Post updated successfully',
    });
  }

  @joiValidation(postSchema)
  public async withImage(req: Request, res: Response): Promise<void> {
    const { imgId, imgVersion } = req.body;
    if (imgId && imgVersion) {
      await UpdatePost.prototype.updatePostWithImage(req);
    } else {
      const result: UploadApiResponse =
        await UpdatePost.prototype.addImageToExistingPost(req);
      if (!result.public_id) {
        throw new BadRequestError(result.message);
      }
    }
    res.status(HTTP_STATUS.OK).json({
      message: 'Post with image updated successfully',
    });
  }

  private async updatePostWithImage(req: Request): Promise<void> {
    const { postId } = req.params;
    const {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      imgVersion,
      imgId,
    } = req.body;

    const updatedPost: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      imgVersion,
      imgId,
    } as IPostDocument;

    const newPostUpdated: IPostDocument = await postCache.updatePostInCache(
      postId,
      updatedPost
    );

    socketIOPostObject.emit('update post', newPostUpdated, 'posts');
    postQueue.addPostJob('updatePostInDB', {
      key: postId,
      value: newPostUpdated,
    });

    // return newPostUpdated;
  }

  private async addImageToExistingPost(
    req: Request
  ): Promise<UploadApiResponse> {
    const { postId } = req.params;
    const { post, bgColor, privacy, feelings, gifUrl, profilePicture, image } =
      req.body;

    const resultUpload: UploadApiResponse = (await uploads(
      image
    )) as UploadApiResponse;
    if (!resultUpload.public_id) {
      return resultUpload;
    }

    const updatedPost: IPostDocument = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      imgVersion: resultUpload.version.toString(),
      imgId: resultUpload.public_id,
    } as IPostDocument;

    const newPostUpdated: IPostDocument = await postCache.updatePostInCache(
      postId,
      updatedPost
    );

    socketIOPostObject.emit('update post', newPostUpdated, 'post');
    postQueue.addPostJob('updatePostInDB', {
      key: postId,
      value: newPostUpdated,
    });
    // Call image queue to add image to mongodb database - comming soon...
    return resultUpload;
  }
}
