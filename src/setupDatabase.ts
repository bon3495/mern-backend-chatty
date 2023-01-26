import { redisConnection } from '@service/redis/redis.connection';
import Logger from 'bunyan';
import mongoose from 'mongoose';

import { config } from '@root/config';

const log: Logger = config.createLogger('setupDatabase');

export default () => {
  const connect = () => {
    mongoose
      .connect(`${config.DATABASE_URL}`)
      .then(() => {
        log.info('Successfully connected to database');
        redisConnection.connect();
      })
      .catch(err => {
        log.error('Error connecting to database: ', err);
        return process.exit(1);
      });
  };

  connect();

  mongoose.connection.on('disconnected', connect);
};
