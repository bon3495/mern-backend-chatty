import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';
import { reactionService } from '@service/db/reaction.service';
import { ReactionCache } from '@service/redis/reaction.cache';
import { IReactionDocument } from '@reaction/interfaces/reaction.interface';

const reactionCache: ReactionCache = new ReactionCache();

export class GetReactions {
  public async reaction(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;

    const cacheReactions: [IReactionDocument[], number] =
      await reactionCache.getReactionsFromCache({ postId });

    const reactions: [IReactionDocument[], number] =
      cacheReactions[0].length > 0
        ? cacheReactions
        : await reactionService.getPostReactions(
            {
              postId: new mongoose.Types.ObjectId(postId),
            },
            { createdAt: -1 }
          );

    res.status(HTTP_STATUS.OK).json({
      message: 'Post reactions successfully',
      data: {
        reactions: reactions[0],
        count: reactions[1],
      },
    });
  }

  public async singleReactionByUsername(
    req: Request,
    res: Response
  ): Promise<void> {
    const { postId } = req.params;
    const { username } = req.body;

    const cacheReaction: [IReactionDocument, number] | [] =
      await reactionCache.getSingleReactionByUsernameFromCache({
        postId,
        username,
      });

    const reactions: [IReactionDocument, number] | [] =
      cacheReaction.length > 0
        ? cacheReaction
        : await reactionService.getSinglePostReactionByUsername(
            postId,
            username
          );

    res.status(HTTP_STATUS.OK).json({
      message: 'Post reactions successfully',
      data: {
        reactions: reactions.length ? reactions[0] : {},
        count: reactions.length ? reactions[1] : 0,
      },
    });
  }

  public async getReactionByUsername(
    req: Request,
    res: Response
  ): Promise<void> {
    const { username } = req.params;
    const reactions: IReactionDocument[] =
      await reactionService.getReactionByUsername(username);

    res.status(HTTP_STATUS.OK).json({
      message: 'Get all reactions by username successfully',
      data: {
        reactions,
      },
    });
  }
}
