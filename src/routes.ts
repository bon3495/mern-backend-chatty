import { serverAdapter } from '@service/queues/base.queue';
import Logger from 'bunyan';
import { Application } from 'express';

import { authMiddleware } from '@global/helpers/auth-middleware';

import { authRoutes } from '@auth/routes/authRoutes';
import { currentUserRoute } from '@auth/routes/currentUserRoute';

import { config } from './config';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const log: Logger = config.createLogger('server');

const BASE_PATH = '/api/v1';

export default (app: Application) => {
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter());
    app.use(BASE_PATH, authRoutes.routes());
    app.use(BASE_PATH, authRoutes.signoutRoute());
    app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoute.routes());
  };

  routes();
};
