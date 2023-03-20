import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { reactionQueue } from '@service/queues/reaction.queue';
import { ReactionCache } from '@service/redis/reaction.cache';
import {
  IReactionDocument,
  IReactionJob,
} from '@reaction/interfaces/reaction.interface';
import { addReactionSchema } from '@reaction/schemas/reactions';

const reactionCache: ReactionCache = new ReactionCache();

export class AddReactions {
  @joiValidation(addReactionSchema)
  public async handleAdd(req: Request, res: Response): Promise<void> {
    const {
      userTo,
      postId,
      type,
      profilePicture,
      previousReaction,
      postReactions,
    } = req.body;

    const reactionObject: IReactionDocument = {
      _id: new ObjectId(),
      username: req.currentUser!.username,
      avataColor: req.currentUser!.avatarColor,
      type,
      postId,
      profilePicture,
      userTo,
    } as IReactionDocument;

    await reactionCache.savePostReactionToCache({
      key: postId,
      postReactions,
      previousReaction,
      reaction: reactionObject,
      type,
    });

    const databaseReaction: IReactionJob = {
      postId,
      username: req.currentUser!.username,
      type,
      previousReaction,
      reactionObject,
      userFrom: req.currentUser!.userId,
      userTo,
    };

    reactionQueue.addReactionJob('addReactionToDB', databaseReaction);

    res.status(HTTP_STATUS.OK).json({
      message: 'Reaction added successfully',
    });
  }
}
