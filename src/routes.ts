import { Application } from 'express';
import Logger from 'bunyan';
import { config } from './config';

const log: Logger = config.createLogger('server');

export default (app: Application) => {
  const routes = () => {
    const test = '';
    if (test) {
      log.info(app);
    }
  };

  routes();
};
