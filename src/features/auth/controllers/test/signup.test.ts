import { Request, Response } from 'express';
import {
  authMock,
  authMockRequest,
  authMockResponse,
} from '@root/mocks/auth.mock';
import * as cloudinaryUploads from '@global/helpers/cloudinary-upload';
import { CustomError } from '@global/helpers/error-handler';
import { authService } from '@service/db/auth.service';
import { UserCache } from '@service/redis/user.cache';
import { SignUp } from '../signup';

jest.mock('@service/queues/base.queue');
jest.mock('@service/queues/user.queue');
jest.mock('@service/queues/auth.queue');
jest.mock('@service/redis/user.cache');
jest.mock('@global/helpers/cloudinary-upload');

describe('SignUp', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('Should throw an error if username is not available', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: '',
        email: 'bontran2@gmail.com',
        password: 'bon34199',
        avatarColor: 'red',
        avatarImage: 'test',
      }
    ) as Request;

    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((err: CustomError) => {
      expect(err.statusCode).toEqual(400);
      expect(err.serializeErrors().message).toEqual(
        'Username is a required field'
      );
    });
  });

  it('Should throw an error if username length is less than minimum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 's',
        email: 'bontran2@gmail.com',
        password: 'bon34199',
        avatarColor: 'red',
        avatarImage: 'test',
      }
    ) as Request;

    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((err: CustomError) => {
      expect(err.statusCode).toEqual(400);
      expect(err.serializeErrors().message).toEqual('Invalid username');
    });
  });

  it('Should throw an error if username length is greater than maximum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'tranlebaoloc',
        email: 'bontran2@gmail.com',
        password: 'bon34199',
        avatarColor: 'red',
        avatarImage: 'test',
      }
    ) as Request;

    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((err: CustomError) => {
      expect(err.statusCode).toEqual(400);
      expect(err.serializeErrors().message).toEqual('Invalid username');
    });
  });

  it('Should throw an error if email is not valid', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'bontran',
        email: 'bontran@gmail',
        password: 'bon34199',
        avatarColor: 'red',
        avatarImage: 'test',
      }
    ) as Request;

    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((err: CustomError) => {
      expect(err.statusCode).toEqual(400);
      expect(err.serializeErrors().message).toEqual('Email must be valid');
    });
  });

  it('Should throw an error if email is not available', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'bontran',
        email: '',
        password: 'bon34199',
        avatarColor: 'red',
        avatarImage: 'test',
      }
    ) as Request;

    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((err: CustomError) => {
      expect(err.statusCode).toEqual(400);
      expect(err.serializeErrors().message).toEqual(
        'Email is a required field'
      );
    });
  });

  it('Should throw an error if password is not available', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'bontran',
        email: 'bontran@gmail.com',
        password: '',
        avatarColor: 'red',
        avatarImage: 'test',
      }
    ) as Request;

    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((err: CustomError) => {
      expect(err.statusCode).toEqual(400);
      expect(err.serializeErrors().message).toEqual(
        'Password is a required field'
      );
    });
  });

  it('Should throw an error if password length is less than minimum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'bontran',
        email: 'bontran2@gmail.com',
        password: '12',
        avatarColor: 'red',
        avatarImage: 'test',
      }
    ) as Request;

    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((err: CustomError) => {
      expect(err.statusCode).toEqual(400);
      expect(err.serializeErrors().message).toEqual('Invalid password');
    });
  });

  it('Should throw an error if password length is greater than maximum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'bontran',
        email: 'bontran2@gmail.com',
        password: 'bon341995',
        avatarColor: 'red',
        avatarImage: 'test',
      }
    ) as Request;

    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((err: CustomError) => {
      expect(err.statusCode).toEqual(400);
      expect(err.serializeErrors().message).toEqual('Invalid password');
    });
  });

  it('Should throw unauthorize error if user already exists', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'bontran2',
        email: 'bontran2@gmail.com',
        password: 'bon34199',
        avatarColor: 'red',
        avatarImage: 'test',
      }
    ) as Request;

    const res: Response = authMockResponse();

    jest
      .spyOn(authService, 'getUserByUsernameOrEmail')
      .mockResolvedValue(authMock);
    SignUp.prototype.create(req, res).catch((err: CustomError) => {
      expect(err.statusCode).toEqual(400);
      expect(err.serializeErrors().message).toEqual('Invalid credentials');
    });
  });

  it('Should set session data for valid credentials and send correct json response', async () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'aloha',
        email: 'aloha@gmail.com',
        password: 'bon34199',
        avatarColor: 'red',
        avatarImage: 'test',
      }
    ) as Request;

    const res: Response = authMockResponse();

    jest
      .spyOn(authService, 'getUserByUsernameOrEmail')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValue(null as any);
    const userSpy = jest.spyOn(UserCache.prototype, 'saveUserToCache');
    jest
      .spyOn(cloudinaryUploads, 'uploads')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation((): any =>
        Promise.resolve({ version: '12341247', public_id: '1vjw92309f2' })
      );
    await SignUp.prototype.create(req, res);
    expect(req.session?.jwt).toBeDefined();
    expect(res.json).toHaveBeenCalledWith({
      message: 'User created successfully',
      user: userSpy.mock.calls[0][2],
      token: req.session?.jwt,
    });
  });
});
