import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { commentQueue } from '@service/queues/comment.queue';
import { CommentCache } from '@service/redis/comment.cache';
import {
  ICommentDocument,
  ICommentJob,
} from '@comment/interfaces/comment.interface';
import { addCommentSchema } from '@comment/schemas/comment.schema';

const commentCache: CommentCache = new CommentCache();

export class AddComments {
  @joiValidation(addCommentSchema)
  public async handleAdd(req: Request, res: Response): Promise<void> {
    const { postId, userTo, comment, profilePicture } = req.body;
    const commentObjectId: ObjectId = new ObjectId();
    const commentData: ICommentDocument = {
      _id: commentObjectId,
      postId,
      profilePicture,
      comment,
      username: req.currentUser!.username,
      avatarColor: req.currentUser!.avatarColor,
      createdAt: new Date(),
    } as ICommentDocument;

    await commentCache.savePostCommentsToCache({
      postId,
      postCommentsData: JSON.stringify(commentData),
    });

    const databaseCommentData: ICommentJob = {
      postId,
      userTo,
      userFrom: req.currentUser!.userId,
      username: req.currentUser!.username,
      comment: commentData,
    };

    commentQueue.addCommentJob('addCommentToDB', databaseCommentData);

    res.status(HTTP_STATUS.OK).json({
      message: 'Comment created successfully',
    });
  }
}
