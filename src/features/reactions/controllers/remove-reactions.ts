import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { reactionQueue } from '@service/queues/reaction.queue';
import { ReactionCache } from '@service/redis/reaction.cache';

const reactionCache: ReactionCache = new ReactionCache();

export class RemoveReactions {
  public async handleDelete(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const { previousReaction, postReactions } = req.body;

    await reactionCache.removePostReactionFromCache({
      key: postId,
      username: req.currentUser!.username,
      postReactions,
    });

    reactionQueue.addReactionJob('removeReactionFromDB', {
      postId,
      username: req.currentUser!.username,
      previousReaction,
    });

    res.status(HTTP_STATUS.OK).json({
      message: 'Reaction remove from Post successfully',
    });
  }
}
