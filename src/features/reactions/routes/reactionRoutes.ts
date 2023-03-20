import express, { Router } from 'express';
import { authMiddleware } from '@global/helpers/auth-middleware';
import { AddReactions } from '@reaction/controllers/add-reactions';
import { GetReactions } from '@reaction/controllers/get-reactions';
import { RemoveReactions } from '@reaction/controllers/remove-reactions';

class ReactionRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post(
      '/post/reaction',
      authMiddleware.checkAuthentication,
      AddReactions.prototype.handleAdd
    );

    this.router.delete(
      '/post/reaction/:postId',
      authMiddleware.checkAuthentication,
      RemoveReactions.prototype.handleDelete
    );

    this.router.get(
      '/post/reaction/:postId',
      authMiddleware.checkAuthentication,
      GetReactions.prototype.reaction
    );

    this.router.get(
      '/post/single-reaction/:postId',
      authMiddleware.checkAuthentication,
      GetReactions.prototype.singleReactionByUsername
    );

    this.router.get(
      '/post/username-reaction/:username',
      authMiddleware.checkAuthentication,
      GetReactions.prototype.getReactionByUsername
    );

    return this.router;
  }
}

export const reactionRoutes: ReactionRoutes = new ReactionRoutes();
