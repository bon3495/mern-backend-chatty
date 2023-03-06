import { Response } from 'express';
import { AuthPayload, IAuthDocument } from '@auth/interfaces/auth.interface';

export const authMockRequest = (
  sessionData: IJWT,
  body: IAuthMock,
  currentUser?: AuthPayload | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any
) => ({
  session: sessionData,
  body,
  params,
  currentUser,
});

export const authMockResponse = (): Response => {
  const res: Response = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);

  return res;
};

export interface IJWT {
  jwt?: string;
}

export interface IAuthMock {
  _id?: string;
  username?: string;
  email?: string;
  uId?: string;
  password?: string;
  avatarColor?: string;
  avatarImage?: string;
  createdAt?: Date | string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  quote?: string;
  work?: string;
  school?: string;
  location?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  messages?: boolean;
  reactions?: boolean;
  comments?: boolean;
  follows?: boolean;
}

export const authUserPayload: AuthPayload = {
  userId: '63c999cb883be9c3bda23e04',
  uId: '30041553934',
  username: 'Manny',
  email: 'bontran@gmail.com',
  avatarColor: '#9c27b0',
  iat: 12345,
};

export const authMock = {
  _id: '60263f14648fed5246e322d3',
  uId: '1621613119252066',
  username: 'Manny',
  email: 'manny@me.com',
  avatarColor: '#9c27b0',
  createdAt: '2022-08-31T07:42:24.451Z',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  save: () => {},
  comparePassword: () => false,
} as unknown as IAuthDocument;
