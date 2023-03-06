import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { postService } from '@service/db/post.service';
import { PostCache } from '@service/redis/post.cache';
import { IPostDocument } from '@post/interfaces/post.interface';

const postCache: PostCache = new PostCache();

const PAGE_SIZE_DEFAULT = '10';
const PAGE_DEFAULT = '1';

export class GetPosts {
  public async getPostsByQueries(req: Request, res: Response): Promise<void> {
    const { page = PAGE_DEFAULT, pageSize = PAGE_SIZE_DEFAULT } =
      req.query || {};
    const skip: number =
      (Number(page) - 1) *
      (pageSize ? Number(pageSize) : Number(PAGE_SIZE_DEFAULT));
    const limit: number =
      Number(page) * (pageSize ? Number(pageSize) : Number(PAGE_SIZE_DEFAULT));
    const skipForCache = skip === 0 ? skip : skip + 1;
    const postsFromCache = await postCache.getPostsFromCache(
      'post',
      skipForCache,
      limit
    );

    let postsResult: IPostDocument[] = [];
    let totalPosts = 0;

    if (postsFromCache.length > 0) {
      postsResult = [...postsFromCache];
      totalPosts = await postCache.getTotalPostsInCache();
    } else {
      postsResult = await postService.getPosts({}, skip, limit, {
        createdAt: -1,
      });
      totalPosts = await postService.getTotalCountPosts();
    }

    res.status(HTTP_STATUS.OK).json({
      message: 'Get posts successfully!',
      data: {
        posts: postsResult,
        totalPosts,
      },
    });
  }

  public async getPostsWithImgByQueries(
    req: Request,
    res: Response
  ): Promise<void> {
    const { page = PAGE_DEFAULT, pageSize = PAGE_SIZE_DEFAULT } =
      req.query || {};
    const skip: number =
      (Number(page) - 1) *
      (pageSize ? Number(pageSize) : Number(PAGE_SIZE_DEFAULT));
    const limit: number =
      Number(page) * (pageSize ? Number(pageSize) : Number(PAGE_SIZE_DEFAULT));
    const skipForCache = skip === 0 ? skip : skip + 1;
    const postsFromCache = await postCache.getPostsWithImageFromCache(
      'post',
      skipForCache,
      limit
    );

    let postsResult: IPostDocument[];

    if (postsFromCache.length > 0) {
      postsResult = [...postsFromCache];
    } else {
      postsResult = await postService.getPosts(
        { imgId: '$ne', gifUrl: '$ne' },
        skip,
        limit,
        {
          createdAt: -1,
        }
      );
    }

    res.status(HTTP_STATUS.OK).json({
      message: 'Get posts with images successfully!',
      data: {
        posts: postsResult,
      },
    });
  }
}
