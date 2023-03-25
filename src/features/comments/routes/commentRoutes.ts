import express, { Router } from 'express';
import { authMiddleware } from '@global/helpers/auth-middleware';
import { AddComments } from '@comment/controllers/add-comments';
import { GetComments } from '@comment/controllers/get-comments';

class CommentsRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post(
      '/post/comment',
      authMiddleware.checkAuthentication,
      AddComments.prototype.handleAdd
    );

    this.router.get(
      '/post/comments/:postId',
      authMiddleware.checkAuthentication,
      GetComments.prototype.handleGet
    );

    this.router.get(
      '/post/comments-names/:postId',
      authMiddleware.checkAuthentication,
      GetComments.prototype.commentsNamesFromCache
    );

    this.router.get(
      '/post/comments-single/:postId',
      authMiddleware.checkAuthentication,
      GetComments.prototype.singleComment
    );

    return this.router;
  }
}

export const commentsRoutes: CommentsRoutes = new CommentsRoutes();
