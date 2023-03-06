import express, { Router } from 'express';
import { authMiddleware } from '@global/helpers/auth-middleware';
import { CreatePost } from '@post/controllers/create-post';
import { DeletePost } from '@post/controllers/delete-post';
import { GetPosts } from '@post/controllers/get-post';
import { UpdatePost } from '@post/controllers/update-post';

class PostRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get(
      '/post',
      authMiddleware.checkAuthentication,
      GetPosts.prototype.getPostsByQueries
    );
    this.router.get(
      '/post/images',
      authMiddleware.checkAuthentication,
      GetPosts.prototype.getPostsWithImgByQueries
    );
    this.router.post(
      '/post',
      authMiddleware.checkAuthentication,
      CreatePost.prototype.normal
    );

    this.router.post(
      '/post/with-image',
      authMiddleware.checkAuthentication,
      CreatePost.prototype.withImage
    );

    this.router.delete(
      '/post/:postId',
      authMiddleware.checkAuthentication,
      DeletePost.prototype.post
    );

    this.router.put(
      '/post/:postId',
      authMiddleware.checkAuthentication,
      UpdatePost.prototype.normal
    );
    this.router.put(
      '/post/image/:postId',
      authMiddleware.checkAuthentication,
      UpdatePost.prototype.withImage
    );

    return this.router;
  }
}

export const postRoutes: PostRoutes = new PostRoutes();
