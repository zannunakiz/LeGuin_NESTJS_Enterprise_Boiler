import { getConfig as getRedisConfig } from '@/redis/redis.config';
import { JobsOptions, RedisOptions } from 'bullmq';

export const config = {
  prefix: process.env.APP_NAME,
  redis: getRedisConfig() as RedisOptions,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 3,
    attempts: 3,
    backoff: {
      type: 'exponential', // With an exponential backoff, it will retry after 2 ^ attempts * delay milliseconds
      delay: 1000,
    },
  } as JobsOptions,
} as const;
