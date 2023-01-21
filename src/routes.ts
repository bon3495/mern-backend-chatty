import { Application } from 'express';
import Logger from 'bunyan';
import { config } from './config';
import { authRoutes } from '@auth/routes/authRoutes';
import { serverAdapter } from '@services/queues/base.queue';
import { currentUserRoute } from '@auth/routes/currentUserRoute';
import { authMiddleware } from '@global/helpers/auth-middleware';

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
