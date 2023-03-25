import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { isEmpty } from 'lodash';
import mongoose from 'mongoose';
import { commentService } from '@service/db/comment.service';
import { CommentCache } from '@service/redis/comment.cache';
import {
  ICommentDocument,
  ICommentNameList,
} from '@comment/interfaces/comment.interface';

const commentCache: CommentCache = new CommentCache();

export class GetComments {
  public async handleGet(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const cachedComments: ICommentDocument[] =
      await commentCache.getCommentsFromCache({ postId });
    const comments: ICommentDocument[] =
      cachedComments.length > 0
        ? cachedComments
        : await commentService.getPostComments(
            {
              postId: new mongoose.Types.ObjectId(postId),
            },
            {
              createdAt: -1,
            }
          );

    res.status(HTTP_STATUS.OK).json({
      message: 'Get post comments successfully',
      data: {
        comments,
      },
    });
  }

  public async commentsNamesFromCache(
    req: Request,
    res: Response
  ): Promise<void> {
    const { postId } = req.params;
    const cachedCommentsNames: ICommentNameList[] =
      await commentCache.getCommentsNamesFromCache({ postId });
    const commentsNames: ICommentNameList[] = !isEmpty(cachedCommentsNames)
      ? cachedCommentsNames
      : await commentService.getPostCommentsNames(
          {
            postId: new mongoose.Types.ObjectId(postId),
          },
          {
            createdAt: -1,
          }
        );

    res.status(HTTP_STATUS.OK).json({
      message: 'Get post comments names successfully',
      data: {
        comments: commentsNames,
      },
    });
  }

  public async singleComment(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const { commentId } = req.body;
    const cachedSingleComment: ICommentDocument[] =
      await commentCache.getSingleCommentFromCache({ postId, commentId });
    const singleComment: ICommentDocument[] =
      cachedSingleComment.length > 0
        ? cachedSingleComment
        : await commentService.getPostComments(
            {
              _id: new mongoose.Types.ObjectId(postId),
            },
            {
              createdAt: -1,
            }
          );

    res.status(HTTP_STATUS.OK).json({
      message: 'Get single comment successfully',
      data: {
        comments: singleComment[0],
      },
    });
  }
}
