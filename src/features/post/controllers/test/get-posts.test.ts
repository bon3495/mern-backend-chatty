import { Request, Response } from 'express';
import { authUserPayload } from '@root/mocks/auth.mock';
import {
  newPost,
  postMockData,
  postMockRequest,
  postMockResponse,
} from '@root/mocks/post.mock';
import { postService } from '@service/db/post.service';
import { PostCache } from '@service/redis/post.cache';
import { GetPosts } from '@post/controllers/get-post';

jest.useFakeTimers();
jest.mock('@service/queues/base.queue');
jest.mock('@service/redis/post.cache');

describe('GetPosts', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('posts', () => {
    it('should send correct json response if posts exist in cache', async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, {
        page: '1',
        pageSize: '10',
      }) as Request;
      const res: Response = postMockResponse();
      jest
        .spyOn(PostCache.prototype, 'getPostsFromCache')
        .mockResolvedValue([postMockData]);
      jest
        .spyOn(PostCache.prototype, 'getTotalPostsInCache')
        .mockResolvedValue(1);

      await GetPosts.prototype.getPostsByQueries(req, res);
      expect(PostCache.prototype.getPostsFromCache).toHaveBeenCalledWith(
        'post',
        0,
        10
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get posts successfully!',
        data: {
          posts: [postMockData],
          totalPosts: 1,
        },
      });
    });

    it('should send correct json response if posts exist in database', async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, {
        page: '1',
        pageSize: '10',
      }) as Request;
      const res: Response = postMockResponse();
      jest
        .spyOn(PostCache.prototype, 'getPostsFromCache')
        .mockResolvedValue([]);
      jest
        .spyOn(PostCache.prototype, 'getTotalPostsInCache')
        .mockResolvedValue(0);
      jest.spyOn(postService, 'getPosts').mockResolvedValue([postMockData]);
      jest.spyOn(postService, 'getTotalCountPosts').mockResolvedValue(1);

      await GetPosts.prototype.getPostsByQueries(req, res);
      expect(postService.getPosts).toHaveBeenCalledWith({}, 0, 10, {
        createdAt: -1,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get posts successfully!',
        data: {
          posts: [postMockData],
          totalPosts: 1,
        },
      });
    });

    it('should send empty posts', async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, {
        page: '1',
        pageSize: '10',
      }) as Request;
      const res: Response = postMockResponse();
      jest
        .spyOn(PostCache.prototype, 'getPostsFromCache')
        .mockResolvedValue([]);
      jest
        .spyOn(PostCache.prototype, 'getTotalPostsInCache')
        .mockResolvedValue(0);
      jest.spyOn(postService, 'getPosts').mockResolvedValue([]);
      jest.spyOn(postService, 'getTotalCountPosts').mockResolvedValue(0);

      await GetPosts.prototype.getPostsByQueries(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get posts successfully!',
        data: {
          posts: [],
          totalPosts: 0,
        },
      });
    });
  });

  describe('postWithImages', () => {
    it('should send correct json response if posts exist in cache', async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, {
        page: '1',
        pageSize: '10',
      }) as Request;
      const res: Response = postMockResponse();
      jest
        .spyOn(PostCache.prototype, 'getPostsWithImageFromCache')
        .mockResolvedValue([postMockData]);

      await GetPosts.prototype.getPostsWithImgByQueries(req, res);
      expect(
        PostCache.prototype.getPostsWithImageFromCache
      ).toHaveBeenCalledWith('post', 0, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get posts with images successfully!',
        data: {
          posts: [postMockData],
        },
      });
    });

    it('should send correct json response if posts exist in database', async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, {
        page: '1',
      }) as Request;
      const res: Response = postMockResponse();
      jest
        .spyOn(PostCache.prototype, 'getPostsWithImageFromCache')
        .mockResolvedValue([]);
      jest.spyOn(postService, 'getPosts').mockResolvedValue([postMockData]);

      await GetPosts.prototype.getPostsWithImgByQueries(req, res);
      expect(postService.getPosts).toHaveBeenCalledWith(
        { imgId: '$ne', gifUrl: '$ne' },
        0,
        10,
        { createdAt: -1 }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get posts with images successfully!',
        data: {
          posts: [postMockData],
        },
      });
    });

    it('should send empty posts', async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, {
        page: '1',
        pageSize: '10',
      }) as Request;
      const res: Response = postMockResponse();
      jest
        .spyOn(PostCache.prototype, 'getPostsWithImageFromCache')
        .mockResolvedValue([]);
      jest.spyOn(postService, 'getPosts').mockResolvedValue([]);

      await GetPosts.prototype.getPostsWithImgByQueries(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get posts with images successfully!',
        data: {
          posts: [],
        },
      });
    });
  });
});
