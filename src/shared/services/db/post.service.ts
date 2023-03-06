import { Query, UpdateQuery } from 'mongoose';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.schema';
import {
  IGetPostsQuery,
  IPostDocument,
  IQueryComplete,
  IQueryDeleted,
} from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';

class PostService {
  public async addNewPost(
    userId: string,
    createdPost: IPostDocument
  ): Promise<void> {
    const post: Promise<IPostDocument> = PostModel.create(createdPost);
    const user: UpdateQuery<IUserDocument> = UserModel.updateOne(
      { _id: userId },
      { $inc: { postsCount: 1 } }
    );

    await Promise.all([post, user]);
  }

  public async getPosts(
    query: IGetPostsQuery,
    skip = 0,
    limit = 0,
    sort: Record<string, 1 | -1>
  ): Promise<IPostDocument[]> {
    let postQuery = {};
    if (query?.imgId || query?.gifUrl) {
      postQuery = { $or: [{ imgId: { $ne: '' } }, { gifUrl: { $ne: '' } }] };
    } else {
      postQuery = query;
    }

    const postsResult: IPostDocument[] = await PostModel.aggregate([
      { $match: postQuery },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ]);

    return postsResult;
  }

  public async getTotalCountPosts(): Promise<number> {
    const count: number = await PostModel.find({}).countDocuments();

    return count;
  }

  public async deletePost(postId: string, userId: string): Promise<void> {
    const deletePost: Query<IQueryComplete & IQueryDeleted, IPostDocument> =
      PostModel.deleteOne({ _id: postId });
    // delete reaction here ...
    const decrementPostsCount: UpdateQuery<IUserDocument> = UserModel.updateOne(
      { _id: userId },
      { $inc: { postsCount: -1 } }
    );

    await Promise.all([deletePost, decrementPostsCount]);
  }

  public async updatePost(
    postId: string,
    updatedPost: IPostDocument
  ): Promise<void> {
    const newPost: UpdateQuery<IPostDocument> = PostModel.updateOne(
      { _id: postId },
      { $set: updatedPost }
    );

    await Promise.all([newPost]);
  }
}

export const postService: PostService = new PostService();
