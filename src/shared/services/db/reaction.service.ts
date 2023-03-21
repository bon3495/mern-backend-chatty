import { omit } from 'lodash';
import mongoose from 'mongoose';
import { Helpers } from '@global/helpers/helpers';
import { UserCache } from '@service/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { IPostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.model';
import {
  IQueryReaction,
  IReactionDocument,
  IReactionJob,
} from '@reaction/interfaces/reaction.interface';
import { ReactionModel } from '@reaction/models/reaction.model';

const userCache: UserCache = new UserCache();

class ReactionService {
  public async addReactionDataToDB(reactionData: IReactionJob): Promise<void> {
    const {
      postId,
      username,
      previousReaction,
      userTo,
      // userFrom,
      type,
      reactionObject,
    } = reactionData;

    let updateReactionObject: IReactionDocument =
      reactionObject as IReactionDocument;
    if (previousReaction) {
      updateReactionObject = omit(reactionObject, ['_id']);
    }

    // const updatedReaction: [IUserDocument, IReactionDocument, IPostDocument] =

    (await Promise.all([
      userCache.getUserFromCache(`${userTo}`),
      ReactionModel.replaceOne(
        { postId, type: previousReaction, username },
        updateReactionObject,
        { upsert: true }
      ),
      PostModel.findOneAndUpdate(
        {
          _id: postId,
        },
        {
          $inc: {
            [`reactions.${previousReaction}`]: -1,
            [`reactions.${type}`]: 1,
          },
        },
        { new: true }
      ),
    ])) as unknown as [IUserDocument, IReactionDocument, IPostDocument];

    // send reactions notification
  }

  public async removeReactionFromDB(reactionData: IReactionJob): Promise<void> {
    const { postId, username, previousReaction } = reactionData;

    await Promise.all([
      ReactionModel.findOneAndDelete({
        postId,
        type: previousReaction,
        username,
      }),
      PostModel.findOneAndUpdate(
        {
          _id: postId,
        },
        {
          $inc: {
            [`reactions.${previousReaction}`]: -1,
          },
        },
        { new: true }
      ),
    ]);
  }

  public async getPostReactions(
    query: IQueryReaction,
    sort: Record<string, 1 | -1>
  ): Promise<[IReactionDocument[], number]> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: query },
      { $sort: sort },
    ]);

    return [reactions, reactions.length];
  }

  public async getSinglePostReactionByUsername(
    postId: string,
    username: string
  ): Promise<[IReactionDocument, number] | []> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      {
        $match: {
          postId: new mongoose.Types.ObjectId(postId),
          username: Helpers.firstLetterUppercase(username),
        },
      },
    ]);

    return reactions.length > 0 ? [reactions[0], 1] : [];
  }

  public async getReactionByUsername(
    username: string
  ): Promise<IReactionDocument[]> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      {
        $match: {
          username: Helpers.firstLetterUppercase(username),
        },
      },
    ]);

    return reactions;
  }
}

export const reactionService: ReactionService = new ReactionService();
