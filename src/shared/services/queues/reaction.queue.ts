import { reactionWorker } from '@worker/reaction.worker';
import { IReactionJob } from '@reaction/interfaces/reaction.interface';
import { BaseQueue } from './base.queue';

class ReactionQueue extends BaseQueue {
  constructor() {
    super('reactions');
    this.processJob('addReactionToDB', 5, reactionWorker.addReactionToDB);

    this.processJob(
      'removeReactionFromDB',
      5,
      reactionWorker.removeReactionFromDB
    );
  }

  public addReactionJob(name: string, data: IReactionJob) {
    this.addJob(name, data);
  }
}

export const reactionQueue: ReactionQueue = new ReactionQueue();
