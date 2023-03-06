import { postWorker } from '@worker/post.worker';
import { IPostJobData } from '@post/interfaces/post.interface';
import { BaseQueue } from './base.queue';

class PostQueue extends BaseQueue {
  constructor() {
    super('post');
    this.processJob('savePostToDB', 5, postWorker.savePostToDB);

    this.processJob('deletePostFromDB', 5, postWorker.deletePostFromDB);

    this.processJob('updatePostInDB', 5, postWorker.updatePostInDB);
  }

  public addPostJob(name: string, data: IPostJobData) {
    this.addJob(name, data);
  }
}

export const postQueue: PostQueue = new PostQueue();
